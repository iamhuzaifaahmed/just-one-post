<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * "Update database" button for servers without a terminal: after uploading a newer release over the old
 * files, the admin presses it once to run the new migrations.
 */
class UpdateController extends Controller
{
    private const CACHE_KEY = 'pending-migrations';

    /** How many migrations are in the code but not yet in the database (cached for a minute). */
    public static function pending(): int
    {
        return Cache::remember(self::CACHE_KEY, 60, function () {
            try {
                $migrator = app('migrator');
                $files = $migrator->getMigrationFiles(array_merge($migrator->paths(), [database_path('migrations')]));
                $ran = $migrator->getRepository()->getRan();

                return count(array_diff(array_keys($files), $ran));
            } catch (Throwable) {
                return 0;
            }
        });
    }

    public function run(): RedirectResponse
    {
        try {
            Artisan::call('migrate', ['--force' => true]);
            Artisan::call('optimize:clear');
        } catch (Throwable $e) {
            Cache::forget(self::CACHE_KEY);

            return back()->with('error', 'The update failed: '.mb_substr(preg_replace('/\s+/', ' ', $e->getMessage()), 0, 300));
        }

        Cache::forget(self::CACHE_KEY);

        return back()->with('success', 'The database is up to date.');
    }
}
