<?php

namespace App\Services\Publishers;

use App\Models\PostTarget;

/**
 * Posts to a Telegram channel/group through a bot (Bot API). Text is sent as plain text.
 * With media, the text becomes the caption when it fits in 1024 characters; otherwise the
 * media is sent first and the text follows as a second message. Progress is stored on the
 * target so a retry never re-sends something that already went out.
 */
class TelegramPublisher extends BasePublisher
{
    protected function name(): string
    {
        return 'telegram';
    }

    private function url(PostTarget $target, string $method): string
    {
        return rtrim(config('social.telegram_api_base'), '/').'/bot'.$target->account->access_token.'/'.$method;
    }

    public function publish(PostTarget $target): string
    {
        $post = $target->post;
        $chatId = $target->account->meta['chat_id'] ?? $target->account->external_id;
        $body = (string) $post->body;
        $captionMax = (int) config('social.limits.telegram.caption');

        $firstId = $target->meta['media_message_id'] ?? null;

        if ($post->media_type) {
            if (! $firstId) {
                $isVideo = $post->media_type === 'video';
                $caption = ($body !== '' && mb_strlen($body) <= $captionMax) ? $body : '';

                $res = $this->send(fn () => $this->http(1200)
                    ->attach($isVideo ? 'video' : 'photo', fopen($post->mediaFullPath(), 'r'), basename($post->media_path))
                    ->post($this->url($target, $isVideo ? 'sendVideo' : 'sendPhoto'), array_filter([
                        'chat_id' => $chatId,
                        'caption' => $caption,
                        'supports_streaming' => $isVideo ? 'true' : null,
                    ])), 'Telegram '.($isVideo ? 'video' : 'photo'));

                $firstId = (string) $res->json('result.message_id');
                $target->setMeta('media_message_id', $firstId);
                $target->setMeta('caption_sent', $caption !== '');
            }

            $captionSent = (bool) (($target->fresh()->meta ?? [])['caption_sent'] ?? false);
            if ($body !== '' && ! $captionSent && empty($target->fresh()->meta['text_message_id'])) {
                $this->sendText($target, $chatId, $body);
            }

            return $firstId;
        }

        return $this->sendText($target, $chatId, $body);
    }

    private function sendText(PostTarget $target, string $chatId, string $text): string
    {
        $res = $this->send(fn () => $this->http()->asForm()->post($this->url($target, 'sendMessage'), [
            'chat_id' => $chatId,
            'text' => $text,
            'disable_web_page_preview' => 'false',
        ]), 'Telegram message');

        $id = (string) $res->json('result.message_id');
        $target->setMeta('text_message_id', $id);

        return $id;
    }
}
