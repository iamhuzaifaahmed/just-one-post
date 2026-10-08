<?php

namespace App\Jobs;

use App\Models\PostTarget;
use App\Services\Publishers\PublisherFactory;
use App\Services\Publishers\PublishException;
use App\Services\PostValidator;
use App\Services\TokenManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Publishes ONE post to ONE account. Idempotent: re-running never posts twice.
 */
class PublishTargetJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // Real attempt accounting lives on post_targets.attempts; these are safety nets
    // (e.g. a worker killed mid-job and the job re-grabbed after retry_after).
    public int $tries = 6;
    public int $timeout = 1500;

    public function __construct(public int $targetId) {}

    public function handle(TokenManager $tokens, PostValidator $validator): void
    {
        $target = $this->claim();
        if (! $target) {
            return;
        }

        try {
            $errors = $validator->validate($target->post, $target->account, $target->overrides ?? []);
            if ($errors) {
                throw PublishException::permanent(implode(' ', $errors));
            }

            $tokens->ensureFresh($target->account);

            $externalId = PublisherFactory::make($target->account->platform)->publish($target);

            // Persist the external id first and in one write with the status: this is what
            // makes a re-run a no-op.
            $target->update([
                'status' => PostTarget::PUBLISHED,
                'external_post_id' => $externalId,
                'published_at' => now(),
                'error' => null,
            ]);
        } catch (PublishException $e) {
            $this->handleFailure($target, $e->getMessage(), $e->retryable, $e->needsReconnect);
        } catch (Throwable $e) {
            Log::error('Unexpected publish error', [
                'target' => $target->id, 'platform' => $target->account->platform,
                'exception' => get_class($e), 'message' => $e->getMessage(),
            ]);
            $this->handleFailure($target, get_class($e).': '.$e->getMessage(), true, false);
        }
    }

    /** Lock the row, skip if already done/cancelled/in flight, mark as publishing. */
    private function claim(): ?PostTarget
    {
        return DB::transaction(function () {
            $target = PostTarget::with(['post', 'account'])->lockForUpdate()->find($this->targetId);

            if (! $target || in_array($target->status, [PostTarget::PUBLISHED, PostTarget::CANCELLED], true)) {
                return null;
            }
            if ($target->external_post_id) {
                $target->update(['status' => PostTarget::PUBLISHED, 'published_at' => $target->published_at ?? now(), 'error' => null]);

                return null;
            }
            // Another worker is mid-flight (a crashed one becomes stale after retry_after).
            if ($target->status === PostTarget::PUBLISHING
                && $target->updated_at->gt(now()->subSeconds((int) config('queue.connections.database.retry_after') - 60))) {
                return null;
            }

            $target->update([
                'status' => PostTarget::PUBLISHING,
                'attempts' => $target->attempts + 1,
                'error' => null,
            ]);

            return $target;
        });
    }

    private function handleFailure(PostTarget $target, string $message, bool $retryable, bool $needsReconnect): void
    {
        $max = (int) config('social.max_attempts');
        $final = ! $retryable || $target->attempts >= $max;

        if ($needsReconnect && ! $target->account->needsReconnect()) {
            $target->account->markNeedsReconnect($message);
        }

        Log::warning('Publish attempt failed', [
            'target' => $target->id, 'platform' => $target->account->platform,
            'attempt' => $target->attempts, 'final' => $final, 'error' => $message,
        ]);

        if ($final) {
            $target->update(['status' => PostTarget::FAILED, 'error' => $message]);

            return;
        }

        $backoff = config('social.backoff')[$target->attempts - 1] ?? 900;
        $target->update([
            'status' => PostTarget::QUEUED,
            'error' => "Attempt {$target->attempts}/$max failed: $message (retrying in {$backoff}s)",
        ]);
        $this->release($backoff);
    }

    /** Called by the queue when the job dies (timeout, max attempts, worker crash). */
    public function failed(Throwable $e): void
    {
        $target = PostTarget::find($this->targetId);
        if ($target && ! in_array($target->status, [PostTarget::PUBLISHED, PostTarget::CANCELLED], true)) {
            $target->update(['status' => PostTarget::FAILED, 'error' => 'Job failed: '.$e->getMessage()]);
        }
    }
}
