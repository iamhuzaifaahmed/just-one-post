<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Post extends Model
{
    protected $fillable = ['body', 'scheduled_at', 'media_path', 'media_type', 'media_mime', 'status'];

    protected function casts(): array
    {
        return ['scheduled_at' => 'datetime'];
    }

    public function targets(): HasMany
    {
        return $this->hasMany(PostTarget::class);
    }

    public function mediaFullPath(): ?string
    {
        return $this->media_path ? Storage::disk('public')->path($this->media_path) : null;
    }

    /** Publicly reachable URL (needed by Instagram). */
    public function mediaPublicUrl(): ?string
    {
        if (! $this->media_path) {
            return null;
        }
        $base = rtrim(config('social.public_base_url') ?: config('app.url'), '/');

        return $base.'/storage/'.ltrim($this->media_path, '/');
    }

    /** Recompute the aggregate status from targets. */
    public function refreshStatus(): void
    {
        $statuses = $this->targets()->pluck('status');
        if ($statuses->isEmpty()) {
            return;
        }

        $active = $statuses->reject(fn ($s) => $s === 'cancelled');

        if ($active->isEmpty()) {
            $new = 'cancelled';
        } elseif ($active->contains(fn ($s) => in_array($s, ['queued', 'publishing']))) {
            $new = 'publishing';
        } elseif ($active->every(fn ($s) => $s === 'published')) {
            $new = 'published';
        } elseif ($active->contains('scheduled')) {
            $new = $active->contains('published') || $active->contains('failed') ? 'partial' : 'scheduled';
        } elseif ($active->every(fn ($s) => $s === 'failed')) {
            $new = 'failed';
        } else {
            $new = 'partial';
        }

        if ($new !== $this->status) {
            $this->update(['status' => $new]);
        }
    }
}
