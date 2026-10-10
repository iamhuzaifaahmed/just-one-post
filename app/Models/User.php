<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'suspended_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Delete the user's posts through the models so their media files are removed too;
        // accounts and settings are removed by the database cascade.
        static::deleting(function (User $user) {
            Post::withoutGlobalScopes()->where('user_id', $user->id)->get()->each->delete();
        });
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class)->withoutGlobalScopes();
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class)->withoutGlobalScopes();
    }

    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }
}
