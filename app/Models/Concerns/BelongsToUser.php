<?php

namespace App\Models\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tenant isolation. While a user is signed in, every query on the model is limited to that
 * user's rows, so route-model binding on someone else's record is a 404, and new rows get the
 * signed-in user as owner. Queue workers, Artisan commands and the admin panel (which uses
 * withoutGlobalScopes) see all rows.
 */
trait BelongsToUser
{
    protected static function bootBelongsToUser(): void
    {
        static::addGlobalScope('owner', function (Builder $query) {
            $id = auth()->id();
            if ($id !== null) {
                $query->where($query->getModel()->getTable().'.user_id', $id);
            }
        });

        static::creating(function ($model) {
            if (empty($model->user_id) && auth()->check()) {
                $model->user_id = auth()->id();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
