<?php

namespace App\Http\Controllers;

use App\Models\SocialAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class ConnectionController extends Controller
{
    /** route platform => [socialite driver, config key for credentials] */
    private const DRIVERS = [
        'linkedin' => 'linkedin-openid',
        'facebook' => 'facebook',
        'youtube' => 'google',
        'threads' => 'threads', // custom OAuth (no Socialite driver); key into config/services.php
        'x' => 'x',
    ];

    public function index(): Response
    {
        $accounts = SocialAccount::orderBy('platform')->orderBy('display_name')->get()
            ->map(fn (SocialAccount $a) => [
                'id' => $a->id,
                'platform' => $a->platform,
                'display_name' => $a->shown_name,
                'original_name' => $a->display_name,
                'label' => $a->label,
                'status' => $a->status,
                'status_message' => $a->status_message,
                'token_state' => $a->tokenState(),
                'token_expires_at' => $a->token_expires_at?->timezone(config('social.display_timezone'))->format('Y-m-d H:i'),
                'has_refresh_token' => $a->canAutoRefresh(),
            ]);

        $configured = [];
        foreach (self::DRIVERS as $platform => $driver) {
            $id = config("services.$driver.client_id");
            $configured[$platform] = filled($id) && ! str_starts_with((string) $id, 'your-');
        }

        // Telegram, Discord and WordPress need no developer app: they are connected with a token/URL/password.
        foreach (['telegram', 'discord', 'wordpress'] as $manual) {
            $configured[$manual] = true;
        }

        return Inertia::render('Connections/Index', [
            'accounts' => $accounts,
            'configured' => $configured,
        ]);
    }

    public function redirect(string $platform)
    {
        if ($platform === 'threads') {
            return $this->threadsRedirect();
        }

        $provider = Socialite::driver(self::DRIVERS[$platform]);

        return match ($platform) {
            'linkedin' => $provider->scopes(['openid', 'profile', 'email', 'w_member_social'])->redirect(),
            'facebook' => $provider->usingGraphVersion(config('social.graph_version'))
                ->scopes([
                    'pages_show_list', 'pages_manage_posts', 'pages_read_engagement',
                    'instagram_basic', 'instagram_content_publish',
                ])->redirect(),
            'youtube' => $provider->scopes([
                'https://www.googleapis.com/auth/youtube.upload',
                'https://www.googleapis.com/auth/youtube.readonly',
            ])->with(['access_type' => 'offline', 'prompt' => 'select_account consent'])->redirect(),
            // Replace Socialite's default scopes (users.email needs extra app permission).
            'x' => $provider->setScopes(['tweet.read', 'tweet.write', 'users.read', 'offline.access', 'media.write'])->redirect(),
        };
    }

    public function callback(Request $request, string $platform): RedirectResponse
    {
        if ($request->has('error')) {
            return redirect()->route('connections.index')
                ->with('error', 'Authorization was cancelled or denied: '.$request->input('error_description', $request->input('error')));
        }

        try {
            if ($platform === 'threads') {
                $count = $this->saveThreads($request);

                return redirect()->route('connections.index')->with('success', "Connected $count account(s) from threads.");
            }

            $user = match ($platform) {
                'facebook' => Socialite::driver('facebook')->usingGraphVersion(config('social.graph_version'))->user(),
                default => Socialite::driver(self::DRIVERS[$platform])->user(),
            };

            $count = match ($platform) {
                'linkedin' => $this->saveLinkedIn($user),
                'facebook' => $this->saveFacebook($user),
                'youtube' => $this->saveYouTube($user),
                'x' => $this->saveX($user),
            };
        } catch (Throwable $e) {
            // Never log tokens: only the class and message of the failure.
            Log::warning("OAuth callback failed for $platform: ".$e->getMessage());

            return redirect()->route('connections.index')->with('error', "Could not connect $platform: ".$e->getMessage());
        }

        return redirect()->route('connections.index')->with('success', "Connected $count account(s) from $platform.");
    }

    public function rename(Request $request, SocialAccount $account): RedirectResponse
    {
        $data = $request->validate(['label' => ['nullable', 'string', 'max:60']]);
        $account->update(['label' => filled($data['label'] ?? null) ? trim($data['label']) : null]);

        return back()->with('success', 'Name updated.');
    }

    public function destroy(SocialAccount $account): RedirectResponse
    {
        $account->delete();

        return redirect()->route('connections.index')->with('success', 'Account disconnected.');
    }

    private function threadsRedirect(): RedirectResponse
    {
        $state = Str::random(40);
        session(['threads_oauth_state' => $state]);

        $query = http_build_query([
            'client_id' => config('services.threads.client_id'),
            'redirect_uri' => config('services.threads.redirect'),
            'scope' => 'threads_basic,threads_content_publish',
            'response_type' => 'code',
            'state' => $state,
        ]);

        return redirect()->away(config('social.threads_auth_url').'?'.$query);
    }

    /** Threads OAuth: code -> short-lived token -> long-lived token (60 days) -> profile. */
    private function saveThreads(Request $request): int
    {
        $expected = (string) session()->pull('threads_oauth_state');
        if ($expected === '' || ! hash_equals($expected, (string) $request->input('state'))) {
            throw new RuntimeException('The Threads login expired or was tampered with. Please press Connect again.');
        }

        $base = rtrim(config('social.threads_api_base'), '/');

        $short = Http::asForm()->post("$base/oauth/access_token", [
            'client_id' => config('services.threads.client_id'),
            'client_secret' => config('services.threads.client_secret'),
            'grant_type' => 'authorization_code',
            'redirect_uri' => config('services.threads.redirect'),
            'code' => (string) $request->input('code'),
        ]);
        if (! $short->successful() || ! $short->json('access_token')) {
            throw new RuntimeException('Threads token exchange failed: '.($short->json('error_message') ?? $short->json('error.message') ?? $short->status()));
        }

        $token = $short->json('access_token');
        $userId = (string) $short->json('user_id');
        $expires = 3600;

        $long = Http::get("$base/access_token", [
            'grant_type' => 'th_exchange_token',
            'client_secret' => config('services.threads.client_secret'),
            'access_token' => $token,
        ]);
        if ($long->successful() && $long->json('access_token')) {
            $token = $long->json('access_token');
            $expires = (int) $long->json('expires_in', 5184000);
        }

        $me = Http::get("$base/v1.0/me", ['fields' => 'id,username,name', 'access_token' => $token]);
        $username = $me->json('username') ?: $userId;
        if (! $me->successful() && $userId === '') {
            throw new RuntimeException('Could not read your Threads profile: '.($me->json('error.message') ?? $me->status()));
        }

        $this->saveRaw('threads', $userId ?: (string) $me->json('id'), '@'.$username, $token, null, now()->addSeconds($expires), [
            'user_id' => $userId ?: $me->json('id'), 'username' => $username,
        ]);

        return 1;
    }

    private function saveX($user): int
    {
        $handle = $user->getNickname() ?: $user->getName() ?: (string) $user->getId();
        $this->upsert('x', (string) $user->getId(), '@'.$handle, $user, ['username' => $handle]);

        return 1;
    }

    private function saveLinkedIn($user): int
    {
        $this->upsert('linkedin', (string) $user->getId(), $user->getName() ?: $user->getEmail() ?: 'LinkedIn member', $user, [
            'person_urn' => 'urn:li:person:'.$user->getId(),
        ]);

        return 1;
    }

    private function saveYouTube($user): int
    {
        $res = Http::withToken($user->token)->get('https://www.googleapis.com/youtube/v3/channels', [
            'part' => 'snippet', 'mine' => 'true',
        ]);
        if (! $res->successful() || empty($res->json('items.0.id'))) {
            throw new \RuntimeException('No YouTube channel found on this Google account (or the YouTube scopes were not granted).');
        }
        $channel = $res->json('items.0');
        $this->upsert('youtube', $channel['id'], $channel['snippet']['title'] ?? 'YouTube channel', $user, [
            'channel_id' => $channel['id'],
        ]);

        return 1;
    }

    /** Facebook login yields one account per Page, plus one per linked Instagram business account. */
    private function saveFacebook($user): int
    {
        $base = 'https://graph.facebook.com/'.config('social.graph_version');

        // Exchange for a long-lived user token so the derived Page tokens do not expire.
        $long = Http::get("$base/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => config('services.facebook.client_id'),
            'client_secret' => config('services.facebook.client_secret'),
            'fb_exchange_token' => $user->token,
        ]);
        $userToken = $long->successful() ? $long->json('access_token', $user->token) : $user->token;

        $pages = [];
        $next = "$base/me/accounts";
        $query = [
            'fields' => 'id,name,access_token,instagram_business_account{id,username}',
            'limit' => 100,
            'access_token' => $userToken,
        ];
        // Follow Graph API pagination so people with more than 100 Pages get all of them (capped at 1,000).
        for ($i = 0; $i < 10 && $next; $i++) {
            // The "next" URL already carries the cursor and token: passing a query array would overwrite them.
            $res = $i === 0 ? Http::get($next, $query) : Http::get($next);
            if (! $res->successful()) {
                throw new \RuntimeException('Could not list Facebook Pages: '.($res->json('error.message') ?? $res->status()));
            }
            $pages = array_merge($pages, $res->json('data', []));
            $next = $res->json('paging.next');
        }

        $count = 0;
        foreach ($pages as $page) {
            $this->saveRaw('facebook', $page['id'], $page['name'], $page['access_token'], null, null, ['page_id' => $page['id']]);
            $count++;

            if ($ig = $page['instagram_business_account'] ?? null) {
                // Instagram publishing through Facebook Login uses the Page access token.
                $this->saveRaw('instagram', $ig['id'], '@'.($ig['username'] ?? $ig['id']), $page['access_token'], null, null, [
                    'page_id' => $page['id'], 'ig_user_id' => $ig['id'],
                ]);
                $count++;
            }
        }

        if ($count === 0) {
            throw new \RuntimeException('No Facebook Pages were returned. Make sure you selected your Page(s) in the consent dialog.');
        }

        return $count;
    }

    private function upsert(string $platform, string $externalId, string $name, $user, array $meta): void
    {
        $expires = isset($user->expiresIn) && $user->expiresIn ? now()->addSeconds((int) $user->expiresIn) : null;
        $this->saveRaw($platform, $externalId, $name, $user->token, $user->refreshToken ?: null, $expires, $meta);
    }

    private function saveRaw(string $platform, string $externalId, string $name, string $token, ?string $refresh, $expires, array $meta): void
    {
        $account = SocialAccount::firstOrNew(['platform' => $platform, 'external_id' => $externalId]);
        $account->fill([
            'display_name' => $name,
            'access_token' => $token,
            // Google only sends a refresh token on consent; never wipe an existing one.
            'refresh_token' => $refresh ?: $account->refresh_token,
            'token_expires_at' => $expires,
            'meta' => array_merge($account->meta ?? [], $meta),
            'status' => SocialAccount::ACTIVE,
            'status_message' => null,
        ])->save();
    }
}
