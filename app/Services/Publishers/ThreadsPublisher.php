<?php

namespace App\Services\Publishers;

use App\Models\PostTarget;
use Illuminate\Http\Client\Response;

/**
 * Threads publishing: create a media container, wait until it is FINISHED, then threads_publish.
 * Image/video URLs must be publicly reachable. The container id is kept on the target so a
 * retry resumes instead of creating a duplicate.
 */
class ThreadsPublisher extends BasePublisher
{
    protected function name(): string
    {
        return 'threads';
    }

    protected function isAuthError(Response $response): bool
    {
        return (int) $response->json('error.code') === 190;
    }

    public function publish(PostTarget $target): string
    {
        $post = $target->post;
        $userId = $target->account->external_id;
        $token = $target->account->access_token;
        $base = rtrim(config('social.threads_api_base'), '/').'/v1.0';

        $containerId = $target->meta['container_id'] ?? null;

        if (! $containerId) {
            $params = ['access_token' => $token];
            if ($post->media_type === 'image') {
                $params += ['media_type' => 'IMAGE', 'image_url' => $this->publicMediaUrl($post, 'Threads')];
            } elseif ($post->media_type === 'video') {
                $params += ['media_type' => 'VIDEO', 'video_url' => $this->publicMediaUrl($post, 'Threads')];
            } else {
                $params += ['media_type' => 'TEXT'];
            }
            if ((string) $post->body !== '') {
                $params['text'] = (string) $post->body;
            }

            $containerId = (string) $this->send(
                fn () => $this->http()->asForm()->post("$base/$userId/threads", $params),
                'Threads create container'
            )->json('id');
            $target->setMeta('container_id', $containerId);
        }

        $this->waitUntilFinished($containerId, $token, $base);

        $response = $this->send(fn () => $this->http()->asForm()->post("$base/$userId/threads_publish", [
            'creation_id' => $containerId,
            'access_token' => $token,
        ]), 'Threads publish');

        return (string) $response->json('id');
    }

    private function waitUntilFinished(string $containerId, string $token, string $base): void
    {
        $max = (int) config('social.instagram_poll_max');
        $sleep = (int) config('social.instagram_poll_sleep');

        for ($i = 0; $i < $max; $i++) {
            $res = $this->send(fn () => $this->http()->get("$base/$containerId", [
                'fields' => 'status,error_message',
                'access_token' => $token,
            ]), 'Threads container status');

            $status = $res->json('status');
            if ($status === 'FINISHED' || $status === 'PUBLISHED') {
                return;
            }
            if (in_array($status, ['ERROR', 'EXPIRED'], true)) {
                throw PublishException::permanent('Threads could not process the post ('.$status.'): '.($res->json('error_message') ?? 'unknown error'));
            }
            if ($sleep > 0) {
                sleep($sleep);
            }
        }

        throw new PublishException('Threads is still processing the media; will check again on retry.');
    }
}
