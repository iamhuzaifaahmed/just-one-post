<?php

namespace Tests\Feature;

use App\Services\Publishers\FacebookPublisher;
use App\Services\Publishers\InstagramPublisher;
use App\Services\Publishers\LinkedInPublisher;
use App\Services\Publishers\PublishException;
use App\Services\Publishers\YouTubePublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\MakesPosts;
use Tests\TestCase;

class PublishersTest extends TestCase
{
    use MakesPosts, RefreshDatabase;

    public function test_linkedin_text_post_uses_versioned_posts_api(): void
    {
        Http::fake(['api.linkedin.com/rest/posts' => Http::response('', 201, ['x-restli-id' => 'urn:li:share:555'])]);
        $target = $this->target($this->account('linkedin'), ['body' => 'Hi (there) #tag']);

        $id = (new LinkedInPublisher)->publish($target);

        $this->assertSame('urn:li:share:555', $id);
        Http::assertSent(function (Request $r) {
            return $r->url() === 'https://api.linkedin.com/rest/posts'
                && $r->hasHeader('Linkedin-Version', config('social.linkedin_version'))
                && $r->hasHeader('X-Restli-Protocol-Version', '2.0.0')
                && $r->hasHeader('Authorization', 'Bearer secret-access-token')
                && $r['author'] === 'urn:li:person:abc123'
                && $r['commentary'] === 'Hi \(there\) #tag'
                && $r['lifecycleState'] === 'PUBLISHED'
                && ! isset($r['content']);
        });
    }

    public function test_linkedin_image_post_uploads_before_posting(): void
    {
        Http::fake([
            'api.linkedin.com/rest/images*' => Http::response(['value' => ['uploadUrl' => 'https://upload.li/abc', 'image' => 'urn:li:image:9']]),
            'upload.li/*' => Http::response('', 201),
            'api.linkedin.com/rest/posts' => Http::response('', 201, ['x-restli-id' => 'urn:li:share:1']),
        ]);
        $target = $this->target($this->account('linkedin'), media: 'image');

        (new LinkedInPublisher)->publish($target);

        Http::assertSent(fn (Request $r) => $r->url() === 'https://api.linkedin.com/rest/posts'
            && $r['content']['media']['id'] === 'urn:li:image:9');
    }

    public function test_linkedin_video_post_uses_multipart_upload_and_finalize(): void
    {
        Http::fake([
            'api.linkedin.com/rest/videos?action=initializeUpload' => Http::response(['value' => [
                'video' => 'urn:li:video:7', 'uploadToken' => 'tok',
                'uploadInstructions' => [['firstByte' => 0, 'lastByte' => 4999, 'uploadUrl' => 'https://upload.li/part1']],
            ]]),
            'upload.li/part1' => Http::response('', 200, ['ETag' => '"etag-1"']),
            'api.linkedin.com/rest/videos?action=finalizeUpload' => Http::response('', 200),
            'api.linkedin.com/rest/posts' => Http::response('', 201, ['x-restli-id' => 'urn:li:share:2']),
        ]);
        $target = $this->target($this->account('linkedin'), media: 'video');

        $this->assertSame('urn:li:share:2', (new LinkedInPublisher)->publish($target));

        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'finalizeUpload')
            && $r['finalizeUploadRequest']['uploadedPartIds'] === ['etag-1']);
    }

    public function test_linkedin_401_means_reconnect(): void
    {
        Http::fake(['api.linkedin.com/*' => Http::response(['message' => 'Invalid access token'], 401)]);
        $target = $this->target($this->account('linkedin'));

        try {
            (new LinkedInPublisher)->publish($target);
            $this->fail('Expected exception');
        } catch (PublishException $e) {
            $this->assertTrue($e->needsReconnect);
            $this->assertFalse($e->retryable);
        }
    }

    public function test_facebook_text_photo_and_video(): void
    {
        Http::fake([
            'graph.facebook.com/*/1111/feed' => Http::response(['id' => '1111_1']),
            'graph.facebook.com/*/1111/photos' => Http::response(['id' => 'p1', 'post_id' => '1111_2']),
            'graph-video.facebook.com/*/1111/videos' => Http::response(['id' => 'v1']),
        ]);
        $account = $this->account('facebook');

        $this->assertSame('1111_1', (new FacebookPublisher)->publish($this->target($account)));
        $this->assertSame('1111_2', (new FacebookPublisher)->publish($this->target($account, media: 'image')));
        $this->assertSame('v1', (new FacebookPublisher)->publish($this->target($account, media: 'video')));

        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/1111/feed') && $r['message'] === 'Hello world'
            && $r['access_token'] === 'secret-access-token');
    }

    public function test_facebook_code_190_flags_reconnect(): void
    {
        Http::fake(['graph.facebook.com/*' => Http::response(['error' => ['message' => 'Session expired', 'code' => 190]], 400)]);

        try {
            (new FacebookPublisher)->publish($this->target($this->account('facebook')));
            $this->fail('Expected exception');
        } catch (PublishException $e) {
            $this->assertTrue($e->needsReconnect);
        }
    }

    public function test_instagram_creates_container_waits_then_publishes(): void
    {
        config(['social.public_base_url' => 'https://example.com', 'social.instagram_poll_sleep' => 0]);
        Http::fake([
            'graph.facebook.com/*/17841400000/media' => Http::response(['id' => 'container-1']),
            'graph.facebook.com/*/container-1*' => Http::sequence()
                ->push(['status_code' => 'IN_PROGRESS'])
                ->push(['status_code' => 'FINISHED']),
            'graph.facebook.com/*/17841400000/media_publish' => Http::response(['id' => 'ig-media-9']),
        ]);
        $target = $this->target($this->account('instagram'), media: 'image');

        $this->assertSame('ig-media-9', (new InstagramPublisher)->publish($target));

        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/media')
            && $r['image_url'] === 'https://example.com/storage/'.$target->post->media_path);
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/media_publish') && $r['creation_id'] === 'container-1');
    }

    public function test_instagram_resumes_existing_container_instead_of_creating_another(): void
    {
        config(['social.public_base_url' => 'https://example.com', 'social.instagram_poll_sleep' => 0]);
        Http::fake([
            'graph.facebook.com/*/container-1*' => Http::response(['status_code' => 'FINISHED']),
            'graph.facebook.com/*/17841400000/media_publish' => Http::response(['id' => 'ig-media-9']),
        ]);
        $target = $this->target($this->account('instagram'), media: 'image', target: ['meta' => ['container_id' => 'container-1']]);

        (new InstagramPublisher)->publish($target);

        Http::assertNotSent(fn (Request $r) => str_ends_with($r->url(), '/17841400000/media'));
    }

    public function test_instagram_refuses_localhost_media_urls(): void
    {
        config(['social.public_base_url' => 'http://localhost:8000']);
        Http::fake();
        $target = $this->target($this->account('instagram'), media: 'image');

        $this->expectException(PublishException::class);
        $this->expectExceptionMessage('PUBLIC_BASE_URL');
        (new InstagramPublisher)->publish($target);
    }

    public function test_youtube_resumable_upload_with_publish_at(): void
    {
        Http::fake([
            'www.googleapis.com/upload/youtube/v3/videos*' => Http::sequence()
                ->push('', 200, ['Location' => 'https://upload.google/session1'])
                ->push(['id' => 'yt-vid-1', 'status' => ['privacyStatus' => 'private']], 201),
            'upload.google/*' => Http::response(['id' => 'yt-vid-1', 'status' => ['privacyStatus' => 'private']], 201),
        ]);
        $future = now()->addDay()->startOfMinute();
        $target = $this->target(
            $this->account('youtube'),
            ['scheduled_at' => $future, 'body' => "My title\nDetails"],
            media: 'video',
            overrides: ['privacy' => 'public', 'native_schedule' => true],
        );

        $this->assertSame('yt-vid-1', (new YouTubePublisher)->publish($target));

        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'uploadType=resumable')
            && $r['snippet']['title'] === 'My title'
            && $r['status']['privacyStatus'] === 'private'
            && $r['status']['publishAt'] === $future->utc()->format('Y-m-d\TH:i:s\Z')
            && $r->hasHeader('X-Upload-Content-Length', '5000'));
    }

    public function test_youtube_warns_when_privacy_is_forced_private(): void
    {
        Http::fake([
            'www.googleapis.com/upload/youtube/v3/videos*' => Http::response('', 200, ['Location' => 'https://upload.google/s']),
            'upload.google/*' => Http::response(['id' => 'v', 'status' => ['privacyStatus' => 'private']], 201),
        ]);
        $target = $this->target($this->account('youtube'), media: 'video', overrides: ['privacy' => 'public']);

        (new YouTubePublisher)->publish($target);

        $this->assertStringContainsString('instead of "public"', $target->fresh()->meta['warning']);
    }
}
