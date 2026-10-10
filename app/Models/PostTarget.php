<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostTarget extends Model
{
    public const SCHEDULED = 'scheduled';
    public const QUEUED = 'queued';
    public const PUBLISHING = 'publishing';
    public const PUBLISHED = 'published';
    public const FAILED = 'failed';
    public const CANCELLED = 'cancelled';

    protected $fillable = [
        'post_id', 'social_account_id', 'status', 'run_at', 'overrides', 'meta',
        'external_post_id', 'error', 'attempts', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'run_at' => 'datetime',
            'published_at' => 'datetime',
            'overrides' => 'array',
            'meta' => 'array',
        ];
    }

    protected static function booted(): void
    {
        // Tenant isolation: while a user is signed in, only targets of their own posts are visible.
        static::addGlobalScope('owner', function (\Illuminate\Database\Eloquent\Builder $query) {
            if (auth()->id() !== null) {
                $query->whereIn('post_targets.post_id', Post::query()->select('posts.id'));
            }
        });

        // Keep the aggregate post status in sync.
        static::saved(fn (PostTarget $t) => $t->post?->refreshStatus());
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class, 'social_account_id');
    }

    public function platform(): string
    {
        return $this->account->platform;
    }

    public function override(string $key, mixed $default = null): mixed
    {
        return data_get($this->overrides, $key, $default);
    }

    public function setMeta(string $key, mixed $value): void
    {
        $meta = $this->meta ?? [];
        $meta[$key] = $value;
        $this->update(['meta' => $meta]);
    }
}
