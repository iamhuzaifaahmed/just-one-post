<?php

namespace App\Services;

use App\Models\Post;
use App\Models\PostTarget;
use App\Models\SocialAccount;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PostService
{
    public function __construct(private PostValidator $validator, private PostDispatcher $dispatcher) {}

    /** Convert a "Y-m-d\TH:i" string entered in the display timezone to UTC. */
    public static function parseLocal(string $local): Carbon
    {
        return Carbon::parse($local, config('social.display_timezone'))->utc();
    }

    /**
     * @param  array{body?:?string, scheduled_at?:?Carbon, targets:array<int,array<string,mixed>>}  $data
     *        targets: social_account_id => overrides
     */
    public function create(array $data, ?UploadedFile $media, bool $publishNow): Post
    {
        $scheduledAt = $publishNow ? now() : ($data['scheduled_at'] ?? null);
        if (! $scheduledAt) {
            throw ValidationException::withMessages(['scheduled_at' => 'Pick a date and time, or use Publish now.']);
        }

        $post = new Post(['body' => $data['body'] ?? null, 'scheduled_at' => $scheduledAt, 'status' => 'scheduled']);
        $this->attachMedia($post, $media);

        $this->assertValid($post, $data['targets']);

        DB::transaction(function () use ($post, $data) {
            $post->save();
            $this->syncTargets($post, $data['targets']);
            $post->refreshStatus();
        });

        if ($publishNow) {
            $this->dispatcher->dispatchDue($post->id);
        }

        return $post->fresh('targets');
    }

    public function update(Post $post, array $data, ?UploadedFile $media, bool $removeMedia, bool $publishNow): Post
    {
        if ($post->targets()->where('status', PostTarget::PUBLISHED)->exists()) {
            throw ValidationException::withMessages(['post' => 'This post has already been published to some platforms and can no longer be edited.']);
        }
        if ($post->targets()->whereIn('status', [PostTarget::QUEUED, PostTarget::PUBLISHING])->exists()) {
            throw ValidationException::withMessages(['post' => 'This post is being published right now.']);
        }

        $scheduledAt = $publishNow ? now() : ($data['scheduled_at'] ?? $post->scheduled_at);
        $post->fill(['body' => $data['body'] ?? null, 'scheduled_at' => $scheduledAt]);

        $oldMedia = $post->media_path;
        if ($media) {
            $this->attachMedia($post, $media);
        } elseif ($removeMedia) {
            $post->fill(['media_path' => null, 'media_type' => null, 'media_mime' => null]);
        }

        $this->assertValid($post, $data['targets']);

        DB::transaction(function () use ($post, $data) {
            $post->save();
            $this->syncTargets($post, $data['targets'], resetFailed: true);
            $post->refreshStatus();
        });

        if ($oldMedia && $oldMedia !== $post->media_path) {
            Storage::disk('public')->delete($oldMedia);
        }

        if ($publishNow) {
            $this->dispatcher->dispatchDue($post->id);
        }

        return $post->fresh('targets');
    }

    /** Cancel everything that has not been published yet. */
    public function cancel(Post $post): void
    {
        $post->targets()
            ->whereIn('status', [PostTarget::SCHEDULED, PostTarget::QUEUED, PostTarget::FAILED])
            ->get()->each->update(['status' => PostTarget::CANCELLED]);
        $post->refreshStatus();
    }

    public function retry(PostTarget $target): void
    {
        if ($target->status !== PostTarget::FAILED) {
            throw ValidationException::withMessages(['target' => 'Only failed targets can be retried.']);
        }

        $target->update(['status' => PostTarget::SCHEDULED, 'attempts' => 0, 'error' => null, 'run_at' => now()]);
        $this->dispatcher->dispatchDue($target->post_id);
    }

    private function attachMedia(Post $post, ?UploadedFile $media): void
    {
        if (! $media) {
            return;
        }
        $mime = (string) $media->getMimeType();
        $type = str_starts_with($mime, 'image/') ? 'image' : (str_starts_with($mime, 'video/') ? 'video' : null);
        if (! $type) {
            throw ValidationException::withMessages(['media' => 'Only image or video files are supported.']);
        }

        $post->fill([
            'media_path' => $media->store('media', 'public'),
            'media_type' => $type,
            'media_mime' => $mime,
        ]);
    }

    /** Run the platform validators against an unsaved post. */
    private function assertValid(Post $post, array $targets): void
    {
        if (empty($targets)) {
            throw ValidationException::withMessages(['targets' => 'Select at least one account to publish to.']);
        }

        $errors = [];
        foreach (SocialAccount::whereIn('id', array_keys($targets))->get() as $account) {
            if ($account->needsReconnect()) {
                $errors[] = "{$account->display_name} needs to be reconnected first.";
            }
            $errors = array_merge($errors, $this->validator->validate($post, $account, $targets[$account->id] ?? []));
        }

        if ($errors) {
            // Clean up a freshly uploaded file when we reject the post.
            if ($post->isDirty('media_path') && $post->media_path) {
                Storage::disk('public')->delete($post->media_path);
            }
            throw ValidationException::withMessages(['targets' => $errors]);
        }
    }

    private function syncTargets(Post $post, array $targets, bool $resetFailed = false): void
    {
        $accounts = SocialAccount::whereIn('id', array_keys($targets))->get()->keyBy('id');

        // Drop targets that were deselected (none are published at this point).
        $post->targets()->whereNotIn('social_account_id', array_keys($targets))->delete();

        foreach ($targets as $accountId => $overrides) {
            $account = $accounts[$accountId] ?? null;
            if (! $account) {
                continue;
            }

            $overrides = $this->cleanOverrides($account->platform, $overrides);
            $runAt = $post->scheduled_at;
            // YouTube "native schedule": upload now as private, YouTube publishes at publishAt.
            if ($account->platform === 'youtube' && ! empty($overrides['native_schedule']) && $post->scheduled_at->isFuture()) {
                $runAt = now();
            }

            $target = $post->targets()->firstOrNew(['social_account_id' => $accountId]);
            $target->fill([
                'overrides' => $overrides ?: null,
                'run_at' => $runAt,
            ]);
            if (! $target->exists || $resetFailed || in_array($target->status, [PostTarget::CANCELLED, PostTarget::FAILED], true)) {
                $target->fill(['status' => PostTarget::SCHEDULED, 'attempts' => 0, 'error' => null, 'meta' => null]);
            }
            $target->save();
        }
    }

    private function cleanOverrides(string $platform, array $overrides): array
    {
        if ($platform === 'wordpress') {
            return array_filter([
                'title' => $overrides['title'] ?? null,
                'status' => in_array($overrides['status'] ?? null, ['publish', 'draft', 'pending'], true) ? $overrides['status'] : 'publish',
            ], fn ($v) => $v !== null && $v !== '');
        }

        if ($platform !== 'youtube') {
            return [];
        }

        return array_filter([
            'title' => $overrides['title'] ?? null,
            'description' => $overrides['description'] ?? null,
            'privacy' => in_array($overrides['privacy'] ?? null, ['private', 'unlisted', 'public'], true) ? $overrides['privacy'] : 'private',
            'native_schedule' => ! empty($overrides['native_schedule']),
        ], fn ($v) => $v !== null && $v !== '');
    }
}
