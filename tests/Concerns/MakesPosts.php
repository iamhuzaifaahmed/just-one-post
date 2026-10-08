<?php

namespace Tests\Concerns;

use App\Models\Post;
use App\Models\PostTarget;
use App\Models\SocialAccount;
use Illuminate\Support\Facades\Storage;

trait MakesPosts
{
    protected function account(string $platform, array $attrs = []): SocialAccount
    {
        return SocialAccount::create(array_merge([
            'platform' => $platform,
            'external_id' => match ($platform) {
                'linkedin' => 'abc123',
                'facebook' => '1111',
                'instagram' => '17841400000',
                'youtube' => 'UCchannel',
            },
            'display_name' => ucfirst($platform).' test',
            'access_token' => 'secret-access-token',
            'status' => 'active',
        ], $attrs));
    }

    /** Store a real JPEG/MP4-ish file on the fake public disk. */
    protected function media(string $type = 'image'): array
    {
        Storage::fake('public');
        clearstatcache(); // Windows: avoid stale stat results for re-created fake files
        if ($type === 'image') {
            ob_start();
            imagejpeg(imagecreatetruecolor(1080, 1080));
            Storage::disk('public')->put($name = 'media/'.uniqid('pic').'.jpg', ob_get_clean());

            return [$name, 'image', 'image/jpeg'];
        }
        Storage::disk('public')->put($name = 'media/'.uniqid('clip').'.mp4', str_repeat('x', 5000));

        return [$name, 'video', 'video/mp4'];
    }

    protected function target(SocialAccount $account, array $post = [], ?string $media = null, array $target = [], array $overrides = []): PostTarget
    {
        [$path, $type, $mime] = $media ? $this->media($media) : [null, null, null];

        $p = Post::create(array_merge([
            'body' => 'Hello world',
            'scheduled_at' => now()->subMinute(),
            'media_path' => $path,
            'media_type' => $type,
            'media_mime' => $mime,
        ], $post));

        return $p->targets()->create(array_merge([
            'social_account_id' => $account->id,
            'status' => 'scheduled',
            'run_at' => $p->scheduled_at,
            'overrides' => $overrides ?: null,
        ], $target))->load(['post', 'account']);
    }
}
