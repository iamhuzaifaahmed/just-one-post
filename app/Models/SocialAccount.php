<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SocialAccount extends Model
{
    public const ACTIVE = 'active';
    public const NEEDS_RECONNECT = 'needs_reconnect';

    protected $fillable = [
        'platform', 'external_id', 'display_name', 'label', 'access_token', 'refresh_token',
        'token_expires_at', 'meta', 'status', 'status_message',
    ];

    protected $hidden = ['access_token', 'refresh_token'];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'token_expires_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    /** The name to show in the UI: your own nickname, else the platform's name. */
    public function getShownNameAttribute(): string
    {
        return filled($this->label) ? $this->label : $this->display_name;
    }

    public function targets(): HasMany
    {
        return $this->hasMany(PostTarget::class);
    }

    public function needsReconnect(): bool
    {
        return $this->status === self::NEEDS_RECONNECT;
    }

    public function markNeedsReconnect(string $reason): void
    {
        $this->update(['status' => self::NEEDS_RECONNECT, 'status_message' => mb_substr($reason, 0, 250)]);
    }

    /** Threads refreshes its long-lived token with itself; the others need a stored refresh token. */
    public function canAutoRefresh(): bool
    {
        return filled($this->refresh_token) || $this->platform === 'threads';
    }

    public function tokenExpiresWithin(int $seconds): bool
    {
        return $this->token_expires_at !== null
            && $this->token_expires_at->lte(now()->addSeconds($seconds));
    }

    /** ok | expiring | expired | needs_reconnect */
    public function tokenState(): string
    {
        if ($this->needsReconnect()) {
            return 'needs_reconnect';
        }
        if ($this->token_expires_at === null) {
            return 'ok';
        }
        if ($this->token_expires_at->isPast() && ! $this->canAutoRefresh()) {
            return 'expired';
        }
        if ($this->token_expires_at->lte(now()->addDays(7)) && ! $this->canAutoRefresh()) {
            return 'expiring';
        }

        return 'ok';
    }
}
