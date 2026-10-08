<?php

namespace App\Services;

use App\Jobs\PublishTargetJob;
use App\Models\PostTarget;

class PostDispatcher
{
    /** Queue every due, still-scheduled target. Returns how many were dispatched. */
    public function dispatchDue(?int $postId = null): int
    {
        $query = PostTarget::query()
            ->where('status', PostTarget::SCHEDULED)
            ->where('run_at', '<=', now())
            ->whereHas('post', fn ($q) => $q->where('status', '!=', 'cancelled'))
            ->orderBy('run_at');

        if ($postId) {
            $query->where('post_id', $postId);
        }

        $count = 0;
        $query->limit(200)->get()->each(function (PostTarget $target) use (&$count) {
            // Atomic claim: two overlapping scheduler runs can never queue the same target twice.
            $claimed = PostTarget::whereKey($target->id)
                ->where('status', PostTarget::SCHEDULED)
                ->update(['status' => PostTarget::QUEUED, 'updated_at' => now()]);

            if ($claimed) {
                PublishTargetJob::dispatch($target->id);
                $target->post?->refreshStatus();
                $count++;
            }
        });

        return $count;
    }
}
