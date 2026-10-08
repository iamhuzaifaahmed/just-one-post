<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostTarget;
use App\Models\SocialAccount;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $tz = config('social.display_timezone');

        $upcoming = Post::with('targets.account')
            ->whereIn('status', ['scheduled', 'publishing', 'partial'])
            ->orderBy('scheduled_at')->limit(5)->get()
            ->map(fn (Post $p) => [
                'id' => $p->id,
                'body' => str($p->body ?? '')->limit(140)->toString(),
                'status' => $p->status,
                'media_type' => $p->media_type,
                'scheduled_display' => $p->scheduled_at?->timezone($tz)->format('D, M j · H:i'),
                'targets' => $p->targets->map(fn ($t) => ['platform' => $t->account->platform, 'status' => $t->status])->values(),
            ]);

        $failures = PostTarget::with(['post', 'account'])
            ->where('status', 'failed')->latest('updated_at')->limit(5)->get()
            ->map(fn (PostTarget $t) => [
                'id' => $t->id,
                'platform' => $t->account->platform,
                'account' => $t->account->shown_name,
                'error' => $t->error,
                'body' => str($t->post->body ?? '')->limit(60)->toString(),
            ]);

        $credentials = collect(['linkedin-openid', 'facebook', 'google'])->contains(
            fn ($d) => filled(config("services.$d.client_id")) && ! str_starts_with((string) config("services.$d.client_id"), 'your-')
        );

        return Inertia::render('Dashboard', [
            'needsReconnect' => SocialAccount::where('status', SocialAccount::NEEDS_RECONNECT)
                ->get()->map(fn ($a) => ['id' => $a->id, 'platform' => $a->platform, 'display_name' => $a->shown_name, 'status_message' => $a->status_message]),
            'expiring' => SocialAccount::where('status', SocialAccount::ACTIVE)->get()
                ->filter(fn ($a) => in_array($a->tokenState(), ['expiring', 'expired']))
                ->map(fn ($a) => ['id' => $a->id, 'platform' => $a->platform, 'display_name' => $a->shown_name,
                    'expires' => $a->token_expires_at?->timezone($tz)->format('M j')])->values(),
            'counts' => [
                'accounts' => SocialAccount::count(),
                'upcoming' => Post::whereIn('status', ['scheduled', 'publishing', 'partial'])->count(),
                'published' => Post::where('status', 'published')->count(),
                'failed' => PostTarget::where('status', 'failed')->count(),
            ],
            'upcoming' => $upcoming,
            'failures' => $failures,
            'setup' => [
                'credentials' => $credentials,
                'accounts' => SocialAccount::exists(),
                'posts' => Post::exists(),
            ],
        ]);
    }
}
