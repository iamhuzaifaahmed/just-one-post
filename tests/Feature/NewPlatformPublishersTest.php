<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Services\PostValidator;
use App\Services\Publishers\DiscordPublisher;
use App\Services\Publishers\PublishException;
use App\Services\Publishers\TelegramPublisher;
use App\Services\Publishers\ThreadsPublisher;
use App\Services\Publishers\WordPressPublisher;
use App\Services\Publishers\XPublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\MakesPosts;
use Tests\TestCase;

class NewPlatformPublishersTest extends TestCase
{
    use MakesPosts, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['social.instagram_poll_sleep' => 0]);
    }

    /* ------------------------------ Telegram ------------------------------ */

    public function test_telegram_text_message(): void
    {
        Http::fake(['api.telegram.org/bot*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 77]])]);
        $target = $this->target($this->account('telegram'), ['body' => 'Hello *plain* text']);

        $this->assertSame('77', (new TelegramPublisher)->publish($target));

        Http::assertSent(fn (Request $r) => str_contains($r->url(), '/botsecret-access-token/sendMessage')
            && $r['chat_id'] === '-1001234567890'
            && $r['text'] === 'Hello *plain* text'
            && ! isset($r['parse_mode']));
    }

    public function test_telegram_photo_uses_short_text_as_caption(): void
    {
        Http::fake(['api.telegram.org/bot*/sendPhoto' => Http::response(['ok' => true, 'result' => ['message_id' => 5]])]);
        $target = $this->target($this->account('telegram'), ['body' => 'Nice picture'], media: 'image');

        $this->assertSame('5', (new TelegramPublisher)->publish($target));

        Http::assertSentCount(1);
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/sendPhoto') && collect($r->data())->contains(fn ($p) => ($p['name'] ?? '') === 'caption' && $p['contents'] === 'Nice picture'));
    }

    public function test_telegram_long_text_with_media_is_sent_as_a_second_message_and_never_resent(): void
    {
        Http::fake([
            'api.telegram.org/bot*/sendVideo' => Http::response(['ok' => true, 'result' => ['message_id' => 10]]),
            'api.telegram.org/bot*/sendMessage' => Http::sequence()
                ->push(['ok' => false, 'description' => 'Too Many Requests: retry after 3', 'error_code' => 429], 429)
                ->push(['ok' => true, 'result' => ['message_id' => 11]]),
        ]);
        $target = $this->target($this->account('telegram'), ['body' => str_repeat('a', 1500)], media: 'video');

        try {
            (new TelegramPublisher)->publish($target);
            $this->fail('expected the first attempt to fail on the text message');
        } catch (PublishException $e) {
            $this->assertTrue($e->retryable);
        }

        // Retry: the video must not be uploaded again.
        $this->assertSame('10', (new TelegramPublisher)->publish($target->fresh(['post', 'account'])));

        $videoUploads = collect(Http::recorded())->filter(fn ($pair) => str_ends_with($pair[0]->url(), '/sendVideo'))->count();
        $this->assertSame(1, $videoUploads);
    }

    /* ------------------------------ Discord ------------------------------ */

    public function test_discord_text_message_never_pings_everyone(): void
    {
        Http::fake(['discord.com/api/webhooks/*' => Http::response(['id' => '999'])]);
        $account = $this->account('discord', ['access_token' => 'https://discord.com/api/webhooks/555000111/tok-en_1']);
        $target = $this->target($account, ['body' => '@everyone hi']);

        $this->assertSame('999', (new DiscordPublisher)->publish($target));

        Http::assertSent(fn (Request $r) => str_starts_with($r->url(), 'https://discord.com/api/webhooks/555000111/tok-en_1?wait=true')
            && $r['content'] === '@everyone hi'
            && $r['allowed_mentions'] === ['parse' => []]);
    }

    public function test_discord_file_upload_uses_multipart_payload_json(): void
    {
        Http::fake(['discord.com/api/webhooks/*' => Http::response(['id' => '1000'])]);
        $account = $this->account('discord', ['access_token' => 'https://discord.com/api/webhooks/555000111/tok']);
        $target = $this->target($account, ['body' => 'with image'], media: 'image');

        (new DiscordPublisher)->publish($target);

        Http::assertSent(function (Request $r) {
            $names = collect($r->data())->pluck('name')->all();

            return in_array('files[0]', $names, true) && in_array('payload_json', $names, true);
        });
    }

    public function test_discord_deleted_webhook_means_reconnect(): void
    {
        Http::fake(['discord.com/api/webhooks/*' => Http::response(['message' => 'Unknown Webhook', 'code' => 10015], 404)]);
        $account = $this->account('discord', ['access_token' => 'https://discord.com/api/webhooks/555000111/tok']);

        try {
            (new DiscordPublisher)->publish($this->target($account));
            $this->fail('expected exception');
        } catch (PublishException $e) {
            $this->assertTrue($e->needsReconnect);
        }
    }

    /* ------------------------------ Threads ------------------------------ */

    public function test_threads_text_post_creates_container_waits_then_publishes(): void
    {
        Http::fake([
            'graph.threads.net/v1.0/90001/threads' => Http::response(['id' => 'cont-1']),
            'graph.threads.net/v1.0/cont-1*' => Http::sequence()->push(['status' => 'IN_PROGRESS'])->push(['status' => 'FINISHED']),
            'graph.threads.net/v1.0/90001/threads_publish' => Http::response(['id' => 'thr-77']),
        ]);
        $target = $this->target($this->account('threads'), ['body' => 'Hello Threads']);

        $this->assertSame('thr-77', (new ThreadsPublisher)->publish($target));

        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/90001/threads')
            && $r['media_type'] === 'TEXT' && $r['text'] === 'Hello Threads' && $r['access_token'] === 'secret-access-token');
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/threads_publish') && $r['creation_id'] === 'cont-1');
    }

    public function test_threads_image_needs_a_public_url_and_sends_image_url(): void
    {
        Http::fake([
            'graph.threads.net/v1.0/90001/threads' => Http::response(['id' => 'cont-2']),
            'graph.threads.net/v1.0/cont-2*' => Http::response(['status' => 'FINISHED']),
            'graph.threads.net/v1.0/90001/threads_publish' => Http::response(['id' => 'thr-1']),
        ]);
        $target = $this->target($this->account('threads'), media: 'image');

        config(['social.public_base_url' => 'http://localhost:8000']);
        try {
            (new ThreadsPublisher)->publish($target);
            $this->fail('expected a refusal for a local URL');
        } catch (PublishException $e) {
            $this->assertStringContainsString('Public base URL', $e->getMessage());
        }
        Http::assertNothingSent();

        config(['social.public_base_url' => 'https://example.com']);
        (new ThreadsPublisher)->publish($target);
        Http::assertSent(fn (Request $r) => ($r['media_type'] ?? null) === 'IMAGE' && $r['image_url'] === 'https://example.com/storage/'.$target->post->media_path);
    }

    public function test_threads_error_190_flags_reconnect(): void
    {
        Http::fake(['graph.threads.net/*' => Http::response(['error' => ['message' => 'Session has expired', 'code' => 190]], 400)]);

        try {
            (new ThreadsPublisher)->publish($this->target($this->account('threads')));
            $this->fail('expected exception');
        } catch (PublishException $e) {
            $this->assertTrue($e->needsReconnect);
        }
    }

    /* ------------------------------ X ------------------------------ */

    public function test_x_text_post(): void
    {
        Http::fake(['api.x.com/2/tweets' => Http::response(['data' => ['id' => '18465', 'text' => 'hi']], 201)]);
        $target = $this->target($this->account('x'), ['body' => 'Hello X']);

        $this->assertSame('18465', (new XPublisher)->publish($target));

        Http::assertSent(fn (Request $r) => $r->url() === 'https://api.x.com/2/tweets'
            && $r->hasHeader('Authorization', 'Bearer secret-access-token')
            && $r['text'] === 'Hello X' && ! isset($r['media']));
    }

    public function test_x_image_uses_chunked_upload_then_attaches_media_id(): void
    {
        Http::fake([
            'api.x.com/2/media/upload/initialize' => Http::response(['data' => ['id' => 'mid-1']]),
            'api.x.com/2/media/upload/mid-1/append' => Http::response('', 204),
            'api.x.com/2/media/upload/mid-1/finalize' => Http::response(['data' => ['id' => 'mid-1']]),
            'api.x.com/2/tweets' => Http::response(['data' => ['id' => '99']], 201),
        ]);
        $target = $this->target($this->account('x'), ['body' => 'pic'], media: 'image');

        $this->assertSame('99', (new XPublisher)->publish($target));

        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/initialize')
            && $r['media_category'] === 'tweet_image' && $r['media_type'] === 'image/jpeg');
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/2/tweets') && $r['media']['media_ids'] === ['mid-1']);
    }

    public function test_x_failed_tweet_after_upload_reuses_the_uploaded_media_on_retry(): void
    {
        Http::fake([
            'api.x.com/2/media/upload/initialize' => Http::response(['data' => ['id' => 'mid-9']]),
            'api.x.com/2/media/upload/mid-9/append' => Http::response('', 204),
            'api.x.com/2/media/upload/mid-9/finalize' => Http::response(['data' => ['id' => 'mid-9']]),
            'api.x.com/2/tweets' => Http::sequence()
                ->push(['title' => 'Service Unavailable', 'detail' => 'try later'], 503)
                ->push(['data' => ['id' => '100']], 201),
        ]);
        $target = $this->target($this->account('x'), ['body' => 'pic'], media: 'image');

        try {
            (new XPublisher)->publish($target);
            $this->fail('expected 503');
        } catch (PublishException $e) {
            $this->assertTrue($e->retryable);
        }
        $this->assertSame('100', (new XPublisher)->publish($target->fresh(['post', 'account'])));

        $uploads = collect(Http::recorded())->filter(fn ($pair) => str_ends_with($pair[0]->url(), '/initialize'))->count();
        $this->assertSame(1, $uploads);
    }

    public function test_x_401_means_reconnect_and_403_message_is_shown(): void
    {
        Http::fake(['api.x.com/2/tweets' => Http::sequence()
            ->push(['title' => 'Unauthorized', 'detail' => 'Unauthorized'], 401)
            ->push(['title' => 'Forbidden', 'detail' => 'You are not allowed to create a Tweet with duplicate content.'], 403)]);
        $target = $this->target($this->account('x'), ['body' => 'dup']);

        try {
            (new XPublisher)->publish($target);
            $this->fail('expected 401');
        } catch (PublishException $e) {
            $this->assertTrue($e->needsReconnect);
        }

        try {
            (new XPublisher)->publish($target);
            $this->fail('expected 403');
        } catch (PublishException $e) {
            $this->assertFalse($e->retryable);
            $this->assertStringContainsString('duplicate content', $e->getMessage());
        }
    }

    /* ------------------------------ WordPress ------------------------------ */

    public function test_wordpress_creates_a_post_with_basic_auth_and_html_paragraphs(): void
    {
        Http::fake(['blog.example.com/wp-json/wp/v2/posts' => Http::response(['id' => 321, 'link' => 'https://blog.example.com/?p=321'], 201)]);
        $target = $this->target($this->account('wordpress'), ['body' => "My first title\nline two\n\nSecond <b>paragraph</b>"]);

        $this->assertSame('321', (new WordPressPublisher)->publish($target));

        Http::assertSent(function (Request $r) {
            return $r->url() === 'https://blog.example.com/wp-json/wp/v2/posts'
                && $r->hasHeader('Authorization', 'Basic '.base64_encode('editor:secret-access-token'))
                && $r['title'] === 'My first title'
                && $r['status'] === 'publish'
                && str_contains($r['content'], '<p>My first title<br>')
                && str_contains($r['content'], '&lt;b&gt;paragraph&lt;/b&gt;');
        });
        $this->assertSame('https://blog.example.com/?p=321', $target->fresh()->meta['url']);
    }

    public function test_wordpress_image_is_uploaded_as_featured_media_and_status_override_is_used(): void
    {
        Http::fake([
            'blog.example.com/wp-json/wp/v2/media' => Http::response(['id' => 55, 'source_url' => 'https://blog.example.com/wp-content/uploads/pic.jpg'], 201),
            'blog.example.com/wp-json/wp/v2/posts' => Http::response(['id' => 322], 201),
        ]);
        $target = $this->target($this->account('wordpress'), ['body' => 'Post body'], media: 'image', overrides: ['title' => 'Custom title', 'status' => 'draft']);

        (new WordPressPublisher)->publish($target);

        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/wp/v2/media')
            && str_contains($r->header('Content-Disposition')[0] ?? '', 'attachment; filename="'));
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/wp/v2/posts')
            && $r['title'] === 'Custom title' && $r['status'] === 'draft' && $r['featured_media'] === 55
            && str_contains($r['content'], 'src="https://blog.example.com/wp-content/uploads/pic.jpg"'));
    }

    public function test_wordpress_401_means_reconnect(): void
    {
        Http::fake(['blog.example.com/*' => Http::response(['code' => 'incorrect_password', 'message' => 'The provided password is an invalid application password.'], 401)]);

        try {
            (new WordPressPublisher)->publish($this->target($this->account('wordpress')));
            $this->fail('expected exception');
        } catch (PublishException $e) {
            $this->assertTrue($e->needsReconnect);
        }
    }

    /* ------------------------------ Validation ------------------------------ */

    public function test_limits_are_enforced_before_publishing(): void
    {
        $v = app(PostValidator::class);
        $post = fn (string $body) => new Post(['body' => $body]);

        // X: URLs count as 23 characters, so a long URL still fits...
        $url = 'https://example.com/'.str_repeat('a', 200);
        $this->assertSame([], $v->validate($post('Check this '.$url), $this->account('x')));
        // ...but 281 plain characters do not.
        $this->assertNotEmpty($v->validate($post(str_repeat('a', 281)), $this->account('x', ['external_id' => 'x2'])));

        $this->assertNotEmpty($v->validate($post(str_repeat('a', 501)), $this->account('threads')));
        $this->assertSame([], $v->validate($post(str_repeat('a', 500)), $this->account('threads', ['external_id' => 't2'])));
        $this->assertNotEmpty($v->validate($post('1 https://a.com 2 https://b.com 3 https://c.com 4 https://d.com 5 https://e.com 6 https://f.com'), $this->account('threads', ['external_id' => 't3'])));

        $this->assertNotEmpty($v->validate($post(str_repeat('a', 2001)), $this->account('discord')));
        $this->assertNotEmpty($v->validate($post(str_repeat('a', 4097)), $this->account('telegram')));
        $this->assertNotEmpty($v->validate($post(''), $this->account('telegram', ['external_id' => 'tg2'])));
        $this->assertNotEmpty($v->validate($post('x'), $this->account('wordpress'), ['status' => 'banana']));
    }
}
