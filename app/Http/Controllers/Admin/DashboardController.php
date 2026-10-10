<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostTarget;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/** System-wide overview for admins: users, usage, queue and scheduler health, recent failures. */
class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $tz = config('social.display_timezone');

        $accounts = SocialAccount::withoutGlobalScopes();
        $targets = PostTarget::withoutGlobalScopes();

        $heartbeat = Cache::get('scheduler.heartbeat');
        $minutesAgo = $heartbeat ? (int) now()->diffInMinutes(\Carbon\Carbon::parse($heartbeat)) : null;

        try {
            $queue = [
                'pending' => DB::table('jobs')->count(),
                'failed' => DB::table('failed_jobs')->count(),
                'oldest_minutes' => ($oldest = DB::table('jobs')->min('created_at')) ? (int) ((time() - $oldest) / 60) : 0,
            ];
        } catch (Throwable) {
            $queue = ['pending' => 0, 'failed' => 0, 'oldest_minutes' => 0];
        }

        return Inertia::render('Admin/Dashboard', [
            'users' => [
                'total' => User::count(),
                'new_7d' => User::where('created_at', '>=', now()->subDays(7))->count(),
                'suspended' => User::whereNotNull('suspended_at')->count(),
                'admins' => User::where('is_admin', true)->count(),
            ],
            'accountsByPlatform' => (clone $accounts)->selectRaw('platform, count(*) as total')->groupBy('platform')->pluck('total', 'platform'),
            'needsReconnect' => (clone $accounts)->where('status', SocialAccount::NEEDS_RECONNECT)->count(),
            'postsByStatus' => Post::withoutGlobalScopes()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'last24h' => [
                'published' => (clone $targets)->where('status', 'published')->where('published_at', '>=', now()->subDay())->count(),
                'failed' => (clone $targets)->where('status', 'failed')->where('updated_at', '>=', now()->subDay())->count(),
            ],
            'queue' => $queue,
            'scheduler' => [
                'last_run_minutes' => $minutesAgo,
                'healthy' => $minutesAgo !== null && $minutesAgo <= 3,
            ],
            'failures' => (clone $targets)->with([
                'post' => fn ($q) => $q->withoutGlobalScopes(),
                'account' => fn ($q) => $q->withoutGlobalScopes(),
                'account.user',
            ])->where('status', 'failed')->latest('updated_at')->limit(10)->get()
                ->map(fn (PostTarget $t) => [
                    'id' => $t->id,
                    'platform' => $t->account?->platform,
                    'account' => $t->account?->shown_name,
                    'user' => $t->account?->user?->email,
                    'error' => $t->error,
                    'when' => $t->updated_at?->timezone($tz)->format('M j, H:i'),
                ]),
        ]);
    }
}
