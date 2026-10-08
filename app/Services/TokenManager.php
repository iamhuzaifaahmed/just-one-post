<?php

namespace App\Services;

use App\Models\SocialAccount;
use App\Services\Publishers\PublishException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TokenManager
{
    /**
     * Make sure the account's access token is usable, refreshing it where the platform allows.
     * Marks the account "needs reconnect" when it cannot be refreshed.
     *
     * @throws PublishException
     */
    public function ensureFresh(SocialAccount $account, int $leewaySeconds = 300): void
    {
        if ($account->needsReconnect()) {
            throw PublishException::reconnect("{$account->display_name} needs to be reconnected.");
        }

        if (! $account->tokenExpiresWithin($leewaySeconds)) {
            return;
        }

        if (! $account->refresh_token) {
            // Facebook/Instagram page tokens have no expiry; LinkedIn tokens cannot be refreshed
            // for standard apps. An expired token with no refresh path means reconnecting.
            if ($account->token_expires_at->isPast()) {
                $account->markNeedsReconnect('Access token expired and cannot be refreshed.');
                throw PublishException::reconnect("{$account->display_name}: access token expired. Reconnect the account.");
            }

            return;
        }

        $this->refresh($account);
    }

    private function refresh(SocialAccount $account): void
    {
        [$url, $credentials] = match ($account->platform) {
            'youtube' => ['https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
            ]],
            'linkedin' => ['https://www.linkedin.com/oauth/v2/accessToken', [
                'client_id' => config('services.linkedin-openid.client_id'),
                'client_secret' => config('services.linkedin-openid.client_secret'),
            ]],
            default => [null, []],
        };

        if (! $url) {
            return;
        }

        try {
            $res = Http::asForm()->timeout(30)->post($url, $credentials + [
                'grant_type' => 'refresh_token',
                'refresh_token' => $account->refresh_token,
            ]);
        } catch (ConnectionException $e) {
            throw new PublishException('Token refresh: network error, will retry.');
        }

        if (! $res->successful() || ! $res->json('access_token')) {
            $detail = $res->json('error_description') ?? $res->json('error') ?? $res->status();
            Log::warning("[{$account->platform}] token refresh failed", ['account' => $account->id, 'status' => $res->status(), 'error' => $detail]);

            if ($res->status() >= 500) {
                throw new PublishException('Token refresh failed temporarily.');
            }

            $account->markNeedsReconnect("Token refresh failed: $detail");
            throw PublishException::reconnect("{$account->display_name}: token refresh failed ($detail). Reconnect the account.");
        }

        $account->update([
            'access_token' => $res->json('access_token'),
            // Google keeps the same refresh token; LinkedIn may rotate it.
            'refresh_token' => $res->json('refresh_token') ?: $account->refresh_token,
            'token_expires_at' => $res->json('expires_in') ? now()->addSeconds((int) $res->json('expires_in')) : null,
        ]);
    }

    /** Daily maintenance: refresh what can be refreshed, flag what cannot. */
    public function refreshExpiring(int $withinDays = 7): int
    {
        $count = 0;
        SocialAccount::where('status', SocialAccount::ACTIVE)
            ->whereNotNull('token_expires_at')
            ->where('token_expires_at', '<=', now()->addDays($withinDays))
            ->each(function (SocialAccount $account) use (&$count) {
                try {
                    $this->ensureFresh($account, $withinDays * 86400);
                    $count++;
                } catch (PublishException $e) {
                    // already flagged on the account where relevant
                }
            });

        return $count;
    }
}
