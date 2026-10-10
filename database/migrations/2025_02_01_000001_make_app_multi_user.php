<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Turns the single-user app into a multi-user SaaS:
 * - users get an admin flag and can be suspended
 * - accounts, posts and settings belong to a user
 * Everything that exists today is handed to the first (existing) user, who becomes the admin.
 */
return new class extends Migration
{
    /** Settings that were global before but are now personal (credentials and timezone). */
    private const USER_KEYS = [
        'linkedin_client_id', 'linkedin_client_secret',
        'facebook_client_id', 'facebook_client_secret',
        'google_client_id', 'google_client_secret',
        'threads_client_id', 'threads_client_secret',
        'x_client_id', 'x_client_secret',
        'display_timezone',
    ];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('password');
            $table->timestamp('suspended_at')->nullable()->after('is_admin');
        });

        $adminId = DB::table('users')->orderBy('id')->value('id');
        if ($adminId) {
            DB::table('users')->where('id', $adminId)->update(['is_admin' => true]);
        }

        foreach (['social_accounts', 'posts'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            });
            if ($adminId) {
                DB::table($tableName)->update(['user_id' => $adminId]);
            }
        }

        // The same external account may be connected by different users.
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropUnique(['platform', 'external_id']);
            $table->unique(['user_id', 'platform', 'external_id']);
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->dropUnique(['key']);
            $table->unique(['user_id', 'key']);
        });
        if ($adminId) {
            DB::table('settings')->whereNull('user_id')->whereIn('key', self::USER_KEYS)->update(['user_id' => $adminId]);
        }
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'key']);
            $table->dropConstrainedForeignId('user_id');
            $table->unique('key');
        });
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'platform', 'external_id']);
            $table->dropConstrainedForeignId('user_id');
            $table->unique(['platform', 'external_id']);
        });
        Schema::table('posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_admin', 'suspended_at']);
        });
    }
};
