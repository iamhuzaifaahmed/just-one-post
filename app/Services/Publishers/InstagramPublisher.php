<?php

namespace App\Services\Publishers;

use App\Models\PostTarget;
use Illuminate\Http\Client\Response;

/**
 * Instagram Business/Creator publishing (Instagram API with Facebook Login):
 * create a media container from a PUBLIC url, wait until it is FINISHED, then media_publish.
 * The container id is kept on the target so a retry resumes instead of creating a duplicate.
 */
class InstagramPublisher extends BasePublisher
{
    protected function name(): string
    {
        return 'instagram';
    }

    protected function isAuthError(Response $response): bool
    {
        return (int) $response->json('error.code') === 190;
    }

    public function publish(PostTarget $target): string
    {
        $post = $target->post;
        $igId = $target->account->external_id;
        $token = $target->account->access_token;
        $base = 'https://graph.facebook.com/'.config('social.graph_version');

        $url = $post->mediaPublicUrl();
        if (! $url) {
            throw PublishException::permanent('Instagram requires an image or video.');
        }
        if (preg_match('#^https?://(localhost|127\.|\[::1\]|[^/:]*\.test)([/:]|$)#i', $url)) {
            throw PublishException::permanent(
                "Instagram must fetch the media from a public URL, but it is \"$url\". Set PUBLIC_BASE_URL to a tunnel (ngrok/cloudflared) or your live domain."
            );
        }

        $containerId = $target->meta['container_id'] ?? null;

        if (! $containerId) {
            $params = ['caption' => (string) $post->body, 'access_token' => $token];
            if ($post->media_type === 'video') {
                $params += ['media_type' => 'REELS', 'video_url' => $url];
            } else {
                $params += ['image_url' => $url];
            }

            $containerId = (string) $this->send(
                fn () => $this->http()->asForm()->post("$base/$igId/media", $params),
                'Instagram create container'
            )->json('id');
            $target->setMeta('container_id', $containerId);
        }

        $this->waitUntilFinished($containerId, $token, $base);

        $response = $this->send(fn () => $this->http()->asForm()->post("$base/$igId/media_publish", [
            'creation_id' => $containerId,
            'access_token' => $token,
        ]), 'Instagram publish');

        return (string) $response->json('id');
    }

    private function waitUntilFinished(string $containerId, string $token, string $base): void
    {
        $max = (int) config('social.instagram_poll_max');
        $sleep = (int) config('social.instagram_poll_sleep');

        for ($i = 0; $i < $max; $i++) {
            $res = $this->send(fn () => $this->http()->get("$base/$containerId", [
                'fields' => 'status_code,status',
                'access_token' => $token,
            ]), 'Instagram container status');

            $code = $res->json('status_code');
            if ($code === 'FINISHED' || $code === 'PUBLISHED') {
                return;
            }
            if (in_array($code, ['ERROR', 'EXPIRED'], true)) {
                throw PublishException::permanent('Instagram could not process the media ('.$code.'): '.($res->json('status') ?? 'unknown error'));
            }
            if ($sleep > 0) {
                sleep($sleep);
            }
        }

        throw new PublishException('Instagram is still processing the media; will check again on retry.');
    }
}
