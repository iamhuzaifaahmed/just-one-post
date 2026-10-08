<?php

namespace App\Services\Publishers;

use App\Models\PostTarget;
use GuzzleHttp\Psr7\Utils;
use Illuminate\Http\Client\Response;

/**
 * YouTube Data API v3 resumable upload (videos.insert, ~1,600 quota units per upload).
 * With the "native schedule" override the video is uploaded early as private and
 * status.publishAt makes YouTube publish it at the scheduled time.
 */
class YouTubePublisher extends BasePublisher
{
    private const UPLOAD = 'https://www.googleapis.com/upload/youtube/v3/videos';

    protected function name(): string
    {
        return 'youtube';
    }

    protected function isAuthError(Response $response): bool
    {
        return $response->status() === 401
            || in_array($response->json('error.errors.0.reason'), ['authError', 'unauthorized'], true);
    }

    public function publish(PostTarget $target): string
    {
        $post = $target->post;
        $token = $target->account->access_token;
        $path = $post->mediaFullPath();

        $title = $target->override('title') ?: $this->firstLine((string) $post->body) ?: 'Untitled';
        $description = $target->override('description') ?? (string) $post->body;
        $privacy = $target->override('privacy', 'private');

        $status = ['privacyStatus' => $privacy, 'selfDeclaredMadeForKids' => false];
        if ($target->override('native_schedule') && $post->scheduled_at && $post->scheduled_at->isFuture()) {
            // publishAt requires the video to be private at upload time.
            $status['privacyStatus'] = 'private';
            $status['publishAt'] = $post->scheduled_at->utc()->format('Y-m-d\TH:i:s\Z');
        }

        $size = filesize($path);
        $mime = $post->media_mime ?: 'video/*';

        $init = $this->send(fn () => $this->http()->withToken($token)->withHeaders([
            'X-Upload-Content-Length' => (string) $size,
            'X-Upload-Content-Type' => $mime,
        ])->post(self::UPLOAD.'?uploadType=resumable&part=snippet,status', [
            'snippet' => ['title' => mb_substr($title, 0, 100), 'description' => $description, 'categoryId' => '22'],
            'status' => $status,
        ]), 'YouTube upload init');

        $sessionUrl = $init->header('Location');
        if (! $sessionUrl) {
            throw PublishException::permanent('YouTube upload init returned no session URL.');
        }

        $stream = fopen($path, 'rb');
        try {
            $upload = $this->send(fn () => $this->http(3600)->withToken($token)
                ->withBody(Utils::streamFor($stream), $mime)
                ->put($sessionUrl), 'YouTube video upload');
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        $videoId = (string) $upload->json('id');
        if ($videoId === '') {
            throw PublishException::permanent('YouTube upload completed but returned no video id.');
        }

        // Unverified API projects can have uploads locked to private; surface that.
        $actual = $upload->json('status.privacyStatus');
        if ($actual && $actual !== $status['privacyStatus']) {
            $target->setMeta('warning', "YouTube set the video to \"$actual\" instead of \"{$status['privacyStatus']}\" (unverified API project?).");
        } elseif (isset($status['publishAt'])) {
            $target->setMeta('warning', 'Uploaded as private; YouTube will publish it at '.$status['publishAt'].' UTC.');
        }

        return $videoId;
    }

    private function firstLine(string $text): string
    {
        return trim(strtok($text, "\n") ?: '');
    }
}
