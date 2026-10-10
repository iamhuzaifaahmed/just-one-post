<?php

namespace App\Services\Publishers;

use App\Models\PostTarget;
use Illuminate\Http\Client\Response;

/** Posts to a Discord channel through a webhook URL (stored encrypted as the account's token). */
class DiscordPublisher extends BasePublisher
{
    protected function name(): string
    {
        return 'discord';
    }

    protected function isAuthError(Response $response): bool
    {
        // 10015 = Unknown Webhook (deleted), 50027 = Invalid Webhook Token
        return in_array((int) $response->json('code'), [10015, 50027], true) || $response->status() === 404;
    }

    public function publish(PostTarget $target): string
    {
        $post = $target->post;
        $webhook = $target->account->access_token.'?wait=true';

        // Never let a post ping @everyone/@here or roles.
        $payload = ['content' => (string) $post->body, 'allowed_mentions' => ['parse' => []]];

        if ($post->media_type) {
            $response = $this->send(fn () => $this->http(600)
                ->attach('files[0]', fopen($post->mediaFullPath(), 'r'), basename($post->media_path))
                ->post($webhook, ['payload_json' => json_encode($payload)]), 'Discord upload');
        } else {
            $response = $this->send(fn () => $this->http()->asJson()->post($webhook, $payload), 'Discord message');
        }

        $id = (string) $response->json('id');
        if ($id === '') {
            throw PublishException::permanent('Discord accepted the message but returned no id.');
        }

        return $id;
    }
}
