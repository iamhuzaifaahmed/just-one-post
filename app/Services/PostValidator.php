<?php

namespace App\Services;

use App\Models\Post;
use App\Models\SocialAccount;

/**
 * Per-platform pre-flight checks. Returns human readable errors (empty array = OK).
 * Used when composing (to reject early) and again right before dispatch.
 */
class PostValidator
{
    /**
     * @param  array<string,mixed>  $overrides  platform-specific overrides (youtube title etc.)
     * @return list<string>
     */
    public function validate(Post $post, SocialAccount $account, array $overrides = []): array
    {
        $limits = config('social.limits.'.$account->platform, []);
        $label = config('social.platforms.'.$account->platform, $account->platform).' ('.$account->display_name.')';
        $errors = [];
        $body = (string) $post->body;
        $type = $post->media_type;

        $info = null;
        if ($type && $post->media_path && is_file($post->mediaFullPath())) {
            $info = MediaInfo::read($post->mediaFullPath(), $type);
        }
        $mb = $info ? $info->size / 1048576 : 0;

        switch ($account->platform) {
            case 'linkedin':
                if (mb_strlen($body) > $limits['text']) {
                    $errors[] = "$label: text is ".mb_strlen($body)." characters; the limit is {$limits['text']}.";
                }
                if ($body === '' && ! $type) {
                    $errors[] = "$label: add text or media.";
                }
                $errors = array_merge($errors, $this->mediaSize($label, $type, $mb, $limits));
                $errors = array_merge($errors, $this->duration($label, $info, $limits['video_seconds'] ?? null));
                break;

            case 'facebook':
                if (mb_strlen($body) > $limits['text']) {
                    $errors[] = "$label: text exceeds {$limits['text']} characters.";
                }
                if ($body === '' && ! $type) {
                    $errors[] = "$label: add text or media.";
                }
                $errors = array_merge($errors, $this->mediaSize($label, $type, $mb, $limits));
                $errors = array_merge($errors, $this->duration($label, $info, $limits['video_seconds'] ?? null));
                break;

            case 'instagram':
                if (! $type) {
                    $errors[] = "$label: Instagram posts need an image or a video.";
                }
                if (mb_strlen($body) > $limits['text']) {
                    $errors[] = "$label: caption is ".mb_strlen($body)." characters; the limit is {$limits['text']}.";
                }
                if (preg_match_all('/#\w+/u', $body) > $limits['hashtags']) {
                    $errors[] = "$label: more than {$limits['hashtags']} hashtags.";
                }
                if ($type === 'image') {
                    if ($info && $info->mime && $info->mime !== 'image/jpeg') {
                        $errors[] = "$label: images must be JPEG (got {$info->mime}).";
                    }
                    $errors = array_merge($errors, $this->ratio($label, $info, $limits['image_ratio']));
                }
                if ($type === 'video') {
                    // Posted as a Reel.
                    $errors = array_merge($errors, $this->duration($label, $info, $limits['video_seconds']));
                    $errors = array_merge($errors, $this->ratio($label, $info, $limits['video_ratio']));
                }
                $errors = array_merge($errors, $this->mediaSize($label, $type, $mb, $limits));
                break;

            case 'youtube':
                if ($type !== 'video') {
                    $errors[] = "$label: YouTube requires a video.";
                }
                $title = $overrides['title'] ?? strtok($body, "\n") ?: '';
                if (trim((string) $title) === '') {
                    $errors[] = "$label: a title is required (set a YouTube title or start the caption with one).";
                }
                if (mb_strlen((string) $title) > $limits['title']) {
                    $errors[] = "$label: title exceeds {$limits['title']} characters.";
                }
                if (preg_match('/[<>]/', (string) $title)) {
                    $errors[] = "$label: title cannot contain < or >.";
                }
                $description = $overrides['description'] ?? $body;
                if (strlen((string) $description) > $limits['description_bytes']) {
                    $errors[] = "$label: description exceeds {$limits['description_bytes']} bytes.";
                }
                if ($type === 'video' && $mb > $limits['video_mb']) {
                    $errors[] = "$label: video is ".round($mb)." MB; limit is {$limits['video_mb']} MB.";
                }
                break;
        }

        return $errors;
    }

    /** @return list<string> */
    private function mediaSize(string $label, ?string $type, float $mb, array $limits): array
    {
        if ($type === 'image' && isset($limits['image_mb']) && $mb > $limits['image_mb']) {
            return ["$label: image is ".round($mb, 1)." MB; limit is {$limits['image_mb']} MB."];
        }
        if ($type === 'video' && isset($limits['video_mb']) && $mb > $limits['video_mb']) {
            return ["$label: video is ".round($mb)." MB; limit is {$limits['video_mb']} MB."];
        }

        return [];
    }

    /** @return list<string> */
    private function duration(string $label, ?MediaInfo $info, ?array $range): array
    {
        if (! $info || $info->duration === null || ! $range) {
            return [];
        }
        if ($info->duration < $range[0] || $info->duration > $range[1]) {
            return ["$label: video is ".round($info->duration)."s; allowed {$range[0]}–{$range[1]}s."];
        }

        return [];
    }

    /** @return list<string> */
    private function ratio(string $label, ?MediaInfo $info, array $range): array
    {
        $ratio = $info?->ratio();
        if ($ratio === null) {
            return [];
        }
        if ($ratio < $range[0] || $ratio > $range[1]) {
            return ["$label: aspect ratio ".round($ratio, 2)." is outside the allowed {$range[0]}–{$range[1]} (width/height)."];
        }

        return [];
    }
}
