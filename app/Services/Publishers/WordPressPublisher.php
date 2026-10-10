<?php

namespace App\Services\Publishers;

use App\Models\PostTarget;
use Illuminate\Http\Client\PendingRequest;

/**
 * Publishes a post to a self-hosted WordPress site through the REST API using an
 * Application Password. Images become the featured image (and are embedded at the top),
 * videos are uploaded to the media library and embedded with a <video> tag.
 */
class WordPressPublisher extends BasePublisher
{
    protected function name(): string
    {
        return 'wordpress';
    }

    private function site(PostTarget $target): string
    {
        return rtrim((string) ($target->account->meta['site_url'] ?? ''), '/');
    }

    private function api(PostTarget $target): PendingRequest
    {
        return $this->http(300)->withBasicAuth(
            (string) ($target->account->meta['username'] ?? ''),
            (string) $target->account->access_token,
        );
    }

    public function publish(PostTarget $target): string
    {
        $post = $target->post;
        $site = $this->site($target);
        $body = (string) $post->body;

        $title = trim((string) $target->override('title')) ?: trim((string) strtok($body, "\n")) ?: 'Untitled';
        $status = in_array($target->override('status'), ['publish', 'draft', 'pending'], true) ? $target->override('status') : 'publish';

        $html = $this->toHtml($body);
        $featured = null;

        if ($post->media_type) {
            $media = $target->meta['media'] ?? null;
            if (! $media) {
                $media = $this->uploadMedia($target, $site);
                $target->setMeta('media', $media);
            }

            if ($post->media_type === 'image') {
                $featured = $media['id'];
                $html = '<figure class="wp-block-image"><img src="'.e($media['url']).'" alt=""/></figure>'."\n".$html;
            } else {
                $html = '<figure class="wp-block-video"><video controls src="'.e($media['url']).'"></video></figure>'."\n".$html;
            }
        }

        $payload = array_filter([
            'title' => mb_substr($title, 0, (int) config('social.limits.wordpress.title')),
            'content' => $html,
            'status' => $status,
            'featured_media' => $featured,
        ], fn ($v) => $v !== null);

        $response = $this->send(fn () => $this->api($target)->post("$site/wp-json/wp/v2/posts", $payload), 'WordPress create post');

        $id = (string) $response->json('id');
        if ($id === '') {
            throw PublishException::permanent('WordPress created the post but returned no id.');
        }
        if ($link = $response->json('link')) {
            $target->setMeta('url', $link);
        }

        return $id;
    }

    /** @return array{id:int,url:string} */
    private function uploadMedia(PostTarget $target, string $site): array
    {
        $post = $target->post;
        $filename = basename($post->media_path);

        $res = $this->send(fn () => $this->api($target)
            ->withHeaders(['Content-Disposition' => 'attachment; filename="'.addslashes($filename).'"'])
            ->withBody(file_get_contents($post->mediaFullPath()), $post->media_mime ?: 'application/octet-stream')
            ->post("$site/wp-json/wp/v2/media"), 'WordPress media upload');

        return ['id' => (int) $res->json('id'), 'url' => (string) $res->json('source_url')];
    }

    /** Plain text -> safe HTML paragraphs (blank line = new paragraph, single newline = <br>). */
    private function toHtml(string $text): string
    {
        $paragraphs = preg_split("/\R{2,}/", trim($text)) ?: [];

        return collect($paragraphs)
            ->filter(fn ($p) => trim($p) !== '')
            ->map(fn ($p) => '<p>'.nl2br(e(trim($p)), false).'</p>')
            ->implode("\n");
    }
}
