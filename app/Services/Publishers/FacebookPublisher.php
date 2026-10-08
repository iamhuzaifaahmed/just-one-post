<?php

namespace App\Services\Publishers;

use App\Models\PostTarget;
use Illuminate\Http\Client\Response;

/** Publishes to a Facebook Page using the Page access token. */
class FacebookPublisher extends BasePublisher
{
    protected function name(): string
    {
        return 'facebook';
    }

    protected function isAuthError(Response $response): bool
    {
        // Graph error code 190 = invalid/expired/revoked access token.
        return (int) $response->json('error.code') === 190;
    }

    public function publish(PostTarget $target): string
    {
        $post = $target->post;
        $pageId = $target->account->external_id;
        $token = $target->account->access_token;
        $version = config('social.graph_version');

        if ($post->media_type === 'image') {
            $url = "https://graph.facebook.com/$version/$pageId/photos";
            $response = $this->send(fn () => $this->http(300)
                ->attach('source', fopen($post->mediaFullPath(), 'r'), basename($post->media_path))
                ->post($url, ['caption' => (string) $post->body, 'access_token' => $token]), 'Facebook photo post');

            return (string) ($response->json('post_id') ?? $response->json('id'));
        }

        if ($post->media_type === 'video') {
            $url = "https://graph-video.facebook.com/$version/$pageId/videos";
            $response = $this->send(fn () => $this->http(1200)
                ->attach('source', fopen($post->mediaFullPath(), 'r'), basename($post->media_path))
                ->post($url, ['description' => (string) $post->body, 'access_token' => $token]), 'Facebook video post');

            return (string) $response->json('id');
        }

        $response = $this->send(fn () => $this->http()->asForm()->post(
            "https://graph.facebook.com/$version/$pageId/feed",
            ['message' => (string) $post->body, 'access_token' => $token]
        ), 'Facebook feed post');

        return (string) $response->json('id');
    }
}
