<?php

namespace Tests\Feature;

use App\Jobs\PublishTargetJob;
use App\Models\Post;
use App\Models\PostTarget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Laravel\Socialite\Facades\Socialite;
use Tests\Concerns\MakesPosts;
use Tests\TestCase;

class PostFlowTest extends TestCase
{
    use MakesPosts, RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/posts')->assertRedirect('/login');
        $this->get('/connections')->assertRedirect('/login');
    }

    public function test_scheduling_converts_dhaka_time_to_utc(): void
    {
        $user = $this->owner();
        $acc = $this->account('linkedin');

        $this->actingAs($user)->post('/posts', [
            'body' => 'Scheduled',
            'scheduled_at' => now()->addDay()->setTimezone('Asia/Dhaka')->format('Y-m-d\T').'10:00',
            'targets' => [$acc->id => ['selected' => 1]],
            'action' => 'schedule',
        ])->assertRedirect('/posts');

        $post = Post::firstOrFail();
        $this->assertSame('10:00', $post->scheduled_at->copy()->setTimezone('Asia/Dhaka')->format('H:i'));
        $this->assertSame('04:00', $post->scheduled_at->utc()->format('H:i')); // UTC+6
        $this->assertSame('scheduled', $post->status);
        $this->assertSame($post->scheduled_at->timestamp, $post->targets()->first()->run_at->timestamp);
    }

    public function test_publish_now_queues_immediately(): void
    {
        Queue::fake();
        $user = $this->owner();
        $acc = $this->account('linkedin');

        $this->actingAs($user)->post('/posts', [
            'body' => 'Now', 'targets' => [$acc->id => ['selected' => 1]], 'action' => 'publish_now',
        ])->assertRedirect('/posts');

        Queue::assertPushed(PublishTargetJob::class, 1);
    }

    public function test_platform_validation_rejects_instagram_without_media_and_long_linkedin_text(): void
    {
        $user = $this->owner();
        $ig = $this->account('instagram');
        $li = $this->account('linkedin');

        $this->actingAs($user)->post('/posts', [
            'body' => str_repeat('a', 3001),
            'scheduled_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'targets' => [$ig->id => ['selected' => 1], $li->id => ['selected' => 1]],
        ])->assertSessionHasErrors('targets');

        $this->assertSame(0, Post::count());
    }

    public function test_media_upload_is_stored_and_typed(): void
    {
        Storage::fake('public');
        $user = $this->owner();
        $acc = $this->account('linkedin');

        $this->actingAs($user)->post('/posts', [
            'body' => 'With pic',
            'scheduled_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'media' => UploadedFile::fake()->image('p.jpg', 800, 800),
            'targets' => [$acc->id => ['selected' => 1]],
        ])->assertRedirect('/posts');

        $post = Post::firstOrFail();
        $this->assertSame('image', $post->media_type);
        Storage::disk('public')->assertExists($post->media_path);
    }

    public function test_cancel_edit_and_retry(): void
    {
        Queue::fake();
        $user = $this->owner();
        $acc = $this->account('linkedin');
        $target = $this->target($acc, ['scheduled_at' => now()->addDay()], target: ['run_at' => now()->addDay()]);
        $post = $target->post;

        // edit
        $this->actingAs($user)->post("/posts/{$post->id}", [
            'body' => 'Edited',
            'scheduled_at' => now()->addDays(2)->format('Y-m-d\TH:i'),
            'targets' => [$acc->id => ['selected' => 1]],
        ])->assertRedirect('/posts');
        $this->assertSame('Edited', $post->fresh()->body);

        // cancel
        $this->actingAs($user)->post("/posts/{$post->id}/cancel")->assertRedirect();
        $this->assertSame('cancelled', $target->fresh()->status);
        $this->assertSame('cancelled', $post->fresh()->status);

        // retry only works on failed
        $target->update(['status' => 'failed', 'error' => 'x']);
        $this->actingAs($user)->post("/targets/{$target->id}/retry")->assertRedirect();
        Queue::assertPushed(PublishTargetJob::class, 1);
        $this->assertSame('queued', $target->fresh()->status);
        $this->assertNull($target->fresh()->error);
    }

    public function test_published_posts_cannot_be_edited(): void
    {
        $user = $this->owner();
        $target = $this->target($this->account('linkedin'), target: ['status' => 'published', 'external_post_id' => 'x']);

        $this->actingAs($user)->post("/posts/{$target->post_id}", [
            'body' => 'Nope', 'scheduled_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'targets' => [$target->social_account_id => ['selected' => 1]],
        ])->assertSessionHasErrors('post');
    }

    public function test_connection_callback_stores_linkedin_account_encrypted(): void
    {
        $user = $this->owner();
        $socialite = new \Laravel\Socialite\Two\User;
        $socialite->id = 'sub-123';
        $socialite->name = 'Huz';
        $socialite->token = 'li-token';
        $socialite->expiresIn = 5184000;
        $socialite->refreshToken = null;

        $provider = \Mockery::mock(\Laravel\Socialite\Contracts\Provider::class);
        $provider->shouldReceive('user')->andReturn($socialite);
        Socialite::shouldReceive('driver')->with('linkedin-openid')->andReturn($provider);

        $this->actingAs($user)->get('/connections/linkedin/callback?code=abc')->assertRedirect('/connections');

        $account = \App\Models\SocialAccount::firstOrFail();
        $this->assertSame('linkedin', $account->platform);
        $this->assertSame('sub-123', $account->external_id);
        $this->assertSame('li-token', $account->access_token);
        $this->assertNotNull($account->token_expires_at);
    }

    public function test_facebook_callback_creates_page_and_instagram_accounts(): void
    {
        $user = $this->owner();
        config(['services.facebook.client_id' => 'cid', 'services.facebook.client_secret' => 'sec']);
        $socialite = new \Laravel\Socialite\Two\User;
        $socialite->token = 'short-user-token';

        $provider = \Mockery::mock(\Laravel\Socialite\Two\FacebookProvider::class);
        $provider->shouldReceive('usingGraphVersion')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($socialite);
        Socialite::shouldReceive('driver')->with('facebook')->andReturn($provider);

        \Illuminate\Support\Facades\Http::fake([
            '*/oauth/access_token*' => \Illuminate\Support\Facades\Http::response(['access_token' => 'long-user-token']),
            '*/me/accounts*' => \Illuminate\Support\Facades\Http::response(['data' => [[
                'id' => 'page1', 'name' => 'My Page', 'access_token' => 'page-token',
                'instagram_business_account' => ['id' => 'ig1', 'username' => 'mybrand'],
            ]]]),
        ]);

        $this->actingAs($user)->get('/connections/facebook/callback?code=abc')->assertRedirect('/connections');

        $this->assertSame(['facebook', 'instagram'], \App\Models\SocialAccount::orderBy('platform')->pluck('platform')->all());
        $this->assertSame('page-token', \App\Models\SocialAccount::where('platform', 'instagram')->first()->access_token);
    }
}
