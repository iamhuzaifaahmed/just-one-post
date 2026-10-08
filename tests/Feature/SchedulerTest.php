<?php

namespace Tests\Feature;

use App\Jobs\PublishTargetJob;
use App\Models\PostTarget;
use App\Services\PostDispatcher;
use App\Services\PostValidator;
use App\Services\TokenManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\MakesPosts;
use Tests\TestCase;

class SchedulerTest extends TestCase
{
    use MakesPosts, RefreshDatabase;

    private function runJob(PostTarget $target): void
    {
        (new PublishTargetJob($target->id))->handle(app(TokenManager::class), app(PostValidator::class));
    }

    public function test_due_targets_are_dispatched_and_future_ones_are_not(): void
    {
        Queue::fake();
        $acc = $this->account('linkedin');
        $due = $this->target($acc, ['scheduled_at' => now()->subMinute()]);
        $future = $this->target($acc, ['scheduled_at' => now()->addHour()]);
        $cancelled = $this->target($acc, ['scheduled_at' => now()->subMinute(), 'status' => 'cancelled'], target: ['status' => 'cancelled']);

        $this->artisan('posts:dispatch-due')->assertSuccessful();

        Queue::assertPushed(PublishTargetJob::class, 1);
        Queue::assertPushed(PublishTargetJob::class, fn ($j) => $j->targetId === $due->id);
        $this->assertSame('queued', $due->fresh()->status);
        $this->assertSame('scheduled', $future->fresh()->status);
        $this->assertSame('cancelled', $cancelled->fresh()->status);
    }

    public function test_running_the_dispatcher_twice_does_not_queue_a_target_twice(): void
    {
        Queue::fake();
        $this->target($this->account('linkedin'));

        $this->assertSame(1, app(PostDispatcher::class)->dispatchDue());
        $this->assertSame(0, app(PostDispatcher::class)->dispatchDue());
        Queue::assertPushed(PublishTargetJob::class, 1);
    }

    public function test_job_publishes_and_marks_target_and_post(): void
    {
        Http::fake(['api.linkedin.com/rest/posts' => Http::response('', 201, ['x-restli-id' => 'urn:li:share:1'])]);
        $target = $this->target($this->account('linkedin'));

        $this->runJob($target);

        $target->refresh();
        $this->assertSame('published', $target->status);
        $this->assertSame('urn:li:share:1', $target->external_post_id);
        $this->assertSame('published', $target->post->fresh()->status);
    }

    public function test_rerunning_a_published_job_never_posts_twice(): void
    {
        Http::fake(['api.linkedin.com/rest/posts' => Http::response('', 201, ['x-restli-id' => 'urn:li:share:1'])]);
        $target = $this->target($this->account('linkedin'));

        $this->runJob($target);
        $this->runJob($target);
        $this->runJob($target);

        Http::assertSentCount(1);
    }

    public function test_job_with_existing_external_id_is_marked_published_without_http(): void
    {
        Http::fake();
        $target = $this->target($this->account('linkedin'), target: ['status' => 'queued', 'external_post_id' => 'urn:li:share:77']);

        $this->runJob($target);

        Http::assertNothingSent();
        $this->assertSame('published', $target->fresh()->status);
    }

    public function test_cancelled_target_is_not_published(): void
    {
        Http::fake();
        $target = $this->target($this->account('linkedin'), target: ['status' => 'cancelled']);

        $this->runJob($target);

        Http::assertNothingSent();
    }

    public function test_transient_failure_retries_with_backoff_then_fails_after_max_attempts(): void
    {
        Http::fake(['api.linkedin.com/rest/posts' => Http::response(['message' => 'boom'], 500)]);
        $target = $this->target($this->account('linkedin'));

        $this->runJob($target);
        $target->refresh();
        $this->assertSame('queued', $target->status);
        $this->assertSame(1, $target->attempts);
        $this->assertStringContainsString('retrying', $target->error);

        $this->runJob($target);
        $this->assertSame('queued', $target->fresh()->status);

        $this->runJob($target);
        $target->refresh();
        $this->assertSame('failed', $target->status);
        $this->assertSame(3, $target->attempts);
        $this->assertStringContainsString('HTTP 500', $target->error);
        $this->assertSame('failed', $target->post->fresh()->status);
    }

    public function test_a_retry_after_a_partial_failure_succeeds_without_duplicates(): void
    {
        Http::fake(['api.linkedin.com/rest/posts' => Http::sequence()
            ->push(['message' => 'boom'], 503)
            ->push('', 201, ['x-restli-id' => 'urn:li:share:9']), ]);
        $target = $this->target($this->account('linkedin'));

        $this->runJob($target);
        $this->runJob($target);
        $this->runJob($target); // extra run after success is a no-op

        $target->refresh();
        $this->assertSame('published', $target->status);
        Http::assertSentCount(2);
    }

    public function test_one_platform_failing_does_not_block_another(): void
    {
        Http::fake([
            'api.linkedin.com/*' => Http::response(['message' => 'bad'], 400),
            'graph.facebook.com/*' => Http::response(['id' => '1111_1']),
        ]);
        $li = $this->target($this->account('linkedin'));
        $fb = $this->target($this->account('facebook'), ['body' => 'x']);

        $this->runJob($li);
        $this->runJob($fb);

        $this->assertSame('failed', $li->fresh()->status); // 400 is permanent, no retry
        $this->assertSame('published', $fb->fresh()->status);
    }

    public function test_validation_failures_fail_without_calling_the_api(): void
    {
        Http::fake();
        $target = $this->target($this->account('youtube')); // youtube without video

        $this->runJob($target);

        Http::assertNothingSent();
        $target->refresh();
        $this->assertSame('failed', $target->status);
        $this->assertStringContainsString('requires a video', $target->error);
    }

    public function test_expired_token_without_refresh_flags_account_for_reconnect(): void
    {
        Http::fake();
        $account = $this->account('linkedin', ['token_expires_at' => now()->subDay()]);
        $target = $this->target($account);

        $this->runJob($target);

        Http::assertNothingSent();
        $this->assertSame('needs_reconnect', $account->fresh()->status);
        $this->assertSame('failed', $target->fresh()->status);
    }

    public function test_expired_google_token_is_refreshed_before_upload(): void
    {
        config(['services.google.client_id' => 'cid', 'services.google.client_secret' => 'sec']);
        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'new-token', 'expires_in' => 3600]),
            'www.googleapis.com/upload/*' => Http::response('', 200, ['Location' => 'https://upload.google/s']),
            'upload.google/*' => Http::response(['id' => 'vid', 'status' => ['privacyStatus' => 'private']], 201),
        ]);
        $account = $this->account('youtube', ['refresh_token' => 'rt', 'token_expires_at' => now()->subMinute()]);
        $target = $this->target($account, media: 'video');

        $this->runJob($target);

        $this->assertSame('published', $target->fresh()->status);
        $this->assertSame('new-token', $account->fresh()->access_token);
        Http::assertSent(fn ($r) => $r->hasHeader('Authorization', 'Bearer new-token'));
    }

    public function test_failed_refresh_marks_account_needs_reconnect(): void
    {
        Http::fake(['oauth2.googleapis.com/token' => Http::response(['error' => 'invalid_grant'], 400)]);
        $account = $this->account('youtube', ['refresh_token' => 'rt', 'token_expires_at' => now()->subMinute()]);
        $target = $this->target($account, media: 'video');

        $this->runJob($target);

        $this->assertSame('needs_reconnect', $account->fresh()->status);
        $this->assertSame('failed', $target->fresh()->status);
    }

    public function test_tokens_are_encrypted_at_rest_and_not_logged(): void
    {
        $account = $this->account('linkedin');

        $raw = \DB::table('social_accounts')->where('id', $account->id)->value('access_token');
        $this->assertStringNotContainsString('secret-access-token', $raw);
        $this->assertSame('secret-access-token', $account->fresh()->access_token);
        $this->assertArrayNotHasKey('access_token', $account->fresh()->toArray());
    }

    public function test_scheduler_registers_dispatch_and_queue_worker(): void
    {
        $this->artisan('schedule:list')
            ->expectsOutputToContain('posts:dispatch-due')
            ->expectsOutputToContain('queue:work --stop-when-empty --max-time=50')
            ->assertSuccessful();
    }
}
