<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Key/value settings. Rows with user_id = null are global (admin only); the others belong to a
 * user (their own developer-app credentials, timezone).
 */
class Setting extends Model
{
    protected $fillable = ['user_id', 'key', 'value'];

    protected function casts(): array
    {
        return ['value' => 'encrypted'];
    }
}
