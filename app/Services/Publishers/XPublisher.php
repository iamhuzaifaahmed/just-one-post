<?php

namespace App\Services\Publishers;

use App\Models\PostTarget;
use Illuminate\Http\Client\PendingRequest;

/**
 * X (Twitter) API v2: media goes through the chunked upload (initialize / append / finalize,
 * then STATUS polling for video), then POST /2/tweets. The uploaded media id is stored on the
 * target so a retry after a failed tweet does not upload the file again.
 *
 * Note: X's API is pay-per-use; every created post is billed to the developer account.
 */
class XPublisher extends BasePublisher
{
    private const CHUNK = 4194304; // 4 MB (X accepts up to 5 MB recommended / 8 MB max per segment)

    protected function name(): string
    {
        return 'x';
    }

    private function api(PostTarget $target): PendingRequest
    {
        return $this->http(120)->withToken($target->account->access_token);
    }

    private function base(): string
    {
        return rtrim(config('social.x_api_base'), '/');
    }

    public function publish(PostTarget $target): string
    {
        $post = $target->post;
        $payload = ['text' => (string) $post->body];

        if ($post->media_type) {
            $mediaId = $target->meta['media_id'] ?? null;
            if (! $mediaId) {
                $mediaId = $this->uploadMedia($target);
                $target->setMeta('media_id', $mediaId);
            }
            $payload['media'] = ['media_ids' => [$mediaId]];
        }

        if ($payload['text'] === '' && ! isset($payload['media'])) {
            throw PublishException::permanent('X needs text or media.');
        }

        $response = $this->send(fn () => $this->api($target)->post($this->base().'/2/tweets', $payload), 'X create post');

        $id = (string) $response->json('data.id');
        if ($id === '') {
            throw PublishException::permanent('X accepted the post but returned no id.');
        }

        return $id;
    }

    private function uploadMedia(PostTarget $target): string
    {
        $post = $target->post;
        $path = $post->mediaFullPath();
        $size = filesize($path);
        $mime = $post->media_mime ?: ($post->media_type === 'video' ? 'video/mp4' : 'image/jpeg');
        $category = match (true) {
            $post->media_type === 'video' => 'tweet_video',
            $mime === 'image/gif' => 'tweet_gif',
            default => 'tweet_image',
        };

        $init = $this->send(fn () => $this->api($target)->post($this->base().'/2/media/upload/initialize', [
            'media_type' => $mime,
            'total_bytes' => $size,
            'media_category' => $category,
        ]), 'X media initialize');

        $mediaId = (string) $init->json('data.id');
        if ($mediaId === '') {
            throw PublishException::permanent('X media initialize returned no media id.');
        }

        $handle = fopen($path, 'rb');
        try {
            $segment = 0;
            while (! feof($handle)) {
                $chunk = fread($handle, self::CHUNK);
                if ($chunk === false || $chunk === '') {
                    break;
                }
                $this->send(fn () => $this->api($target)
                    ->attach('media', $chunk, 'chunk')
                    ->post($this->base()."/2/media/upload/$mediaId/append", ['segment_index' => $segment]), 'X media append');
                $segment++;
            }
        } finally {
            fclose($handle);
        }

        $final = $this->send(fn () => $this->api($target)->post($this->base()."/2/media/upload/$mediaId/finalize"), 'X media finalize');
        $this->waitForProcessing($target, $mediaId, $final->json('data.processing_info'));

        return $mediaId;
    }

    private function waitForProcessing(PostTarget $target, string $mediaId, ?array $info): void
    {
        $tries = 0;
        while ($info && in_array($info['state'] ?? '', ['pending', 'in_progress'], true)) {
            if (++$tries > 30) {
                throw new PublishException('X is still processing the video; will check again on retry.');
            }
            $wait = max(1, min(30, (int) ($info['check_after_secs'] ?? 5)));
            if (config('social.instagram_poll_sleep') > 0) {
                sleep($wait);
            }

            $res = $this->send(fn () => $this->api($target)->get($this->base().'/2/media/upload', [
                'command' => 'STATUS',
                'media_id' => $mediaId,
            ]), 'X media status');
            $info = $res->json('data.processing_info');
        }

        if (($info['state'] ?? '') === 'failed') {
            throw PublishException::permanent('X could not process the media: '.($info['error']['message'] ?? 'unknown error'));
        }
    }
}
