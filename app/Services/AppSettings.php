<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use Throwable;

/**
 * Settings edited from the dashboard, stored encrypted in the database.
 *
 *  - "user" scope: each user's own developer-app credentials (bring your own keys) and timezone.
 *  - "global" scope: app-wide options edited by an admin (public base URL, API versions, ...).
 *
 * Saved values override the matching .env/config defaults. Regular users never fall back to
 * the server's .env credentials; admins (the owner of the install) still do.
 */
class AppSettings
{
    public const USER = 'user';
    public const GLOBAL = 'global';

    /** key => [config path, is secret, group, label, scope] */
    public const FIELDS = [
        'linkedin_client_id' => ['services.linkedin-openid.client_id', false, 'linkedin', 'Client ID', self::USER],
        'linkedin_client_secret' => ['services.linkedin-openid.client_secret', true, 'linkedin', 'Client Secret', self::USER],
        'facebook_client_id' => ['services.facebook.client_id', false, 'facebook', 'App ID', self::USER],
        'facebook_client_secret' => ['services.facebook.client_secret', true, 'facebook', 'App Secret', self::USER],
        'google_client_id' => ['services.google.client_id', false, 'google', 'Client ID', self::USER],
        'google_client_secret' => ['services.google.client_secret', true, 'google', 'Client Secret', self::USER],
        'threads_client_id' => ['services.threads.client_id', false, 'threads', 'Threads App ID', self::USER],
        'threads_client_secret' => ['services.threads.client_secret', true, 'threads', 'Threads App Secret', self::USER],
        'x_client_id' => ['services.x.client_id', false, 'x', 'Client ID', self::USER],
        'x_client_secret' => ['services.x.client_secret', true, 'x', 'Client Secret', self::USER],
        'display_timezone' => ['social.display_timezone', false, 'general', 'Display timezone', self::USER],

        'public_base_url' => ['social.public_base_url', false, 'general', 'Public base URL (for Instagram and Threads media)', self::GLOBAL],
        'meta_graph_version' => ['social.graph_version', false, 'advanced', 'Meta Graph API version', self::GLOBAL],
        'linkedin_api_version' => ['social.linkedin_version', false, 'advanced', 'LinkedIn API version (YYYYMM)', self::GLOBAL],
        'ffprobe_path' => ['social.ffprobe_path', false, 'advanced', 'ffprobe path (optional)', self::GLOBAL],
    ];

    /** OAuth redirect URIs are derived from the current host, not stored. */
    public const REDIRECTS = [
        'services.linkedin-openid.redirect' => '/connections/linkedin/callback',
        'services.facebook.redirect' => '/connections/facebook/callback',
        'services.google.redirect' => '/connections/youtube/callback',
        'services.threads.redirect' => '/connections/threads/callback',
        'services.x.redirect' => '/connections/x/callback',
    ];

    private const REGISTRATION_KEY = 'registration_open';

    private static function query(?int $userId)
    {
        $q = Setting::query();

        return $userId === null ? $q->whereNull('user_id') : $q->where('user_id', $userId);
    }

    /** Boot-time: redirect URIs and the admin's global options. Safe before migrations have run. */
    public static function apply(): void
    {
        foreach (self::REDIRECTS as $path => $uri) {
            config([$path => url($uri)]);
        }

        try {
            foreach (self::query(null)->get() as $setting) {
                $field = self::FIELDS[$setting->key] ?? null;
                if ($field && $field[4] === self::GLOBAL && filled($setting->value)) {
                    config([$field[0] => $setting->value]);
                }
            }
        } catch (Throwable) {
            // table missing (fresh install / tests) or APP_KEY changed: fall back to .env values
        }
    }

    /**
     * Make the config reflect one user's own credentials/timezone. Call it per request (middleware)
     * and per job. Whatever the previous call changed is put back first, so a long-running queue
     * worker never leaks one user's keys into another user's job.
     */
    public static function applyForUser(?User $user): void
    {
        $overlay = app()->bound('appsettings.overlay') ? app('appsettings.overlay') : [];
        foreach ($overlay as $path => $previous) {
            config([$path => $previous]);
        }
        $overlay = [];

        $set = function (string $path, mixed $value) use (&$overlay) {
            if (! array_key_exists($path, $overlay)) {
                $overlay[$path] = config($path);
            }
            config([$path => $value]);
        };

        if ($user) {
            if (! $user->is_admin) {
                // Bring your own keys: regular users start with no credentials at all.
                foreach (self::FIELDS as [$path, , $group, , $scope]) {
                    if ($scope === self::USER && $group !== 'general') {
                        $set($path, null);
                    }
                }
            }

            try {
                foreach (self::query($user->id)->get() as $setting) {
                    $field = self::FIELDS[$setting->key] ?? null;
                    if ($field && $field[4] === self::USER && filled($setting->value)) {
                        $set($field[0], $setting->value);
                    }
                }
            } catch (Throwable) {
            }
        }

        app()->instance('appsettings.overlay', $overlay);
    }

    /** @return array<string,mixed> form state for the fields of one scope (secrets are never returned) */
    public static function forForm(string $scope): array
    {
        $out = [];
        foreach (self::FIELDS as $key => [$path, $secret, , , $fieldScope]) {
            if ($fieldScope !== $scope) {
                continue;
            }
            $current = config($path);
            $isPlaceholder = is_string($current) && str_starts_with($current, 'your-');
            $out[$key] = $secret
                ? ['secret' => true, 'set' => filled($current) && ! $isPlaceholder, 'value' => '']
                : ['secret' => false, 'set' => filled($current), 'value' => $isPlaceholder ? '' : (string) $current];
        }

        return $out;
    }

    /** Save submitted values for one scope; blank secrets keep the stored value. */
    public static function save(array $input, string $scope, ?User $user = null): void
    {
        $userId = $scope === self::USER ? $user?->id : null;

        foreach (self::FIELDS as $key => [, $secret, , , $fieldScope]) {
            if ($fieldScope !== $scope || ! array_key_exists($key, $input)) {
                continue;
            }
            $value = trim((string) $input[$key]);
            if ($value === '') {
                if (! $secret) {
                    self::query($userId)->where('key', $key)->delete(); // cleared -> fall back to the default
                }

                continue;
            }
            Setting::updateOrCreate(['user_id' => $userId, 'key' => $key], ['value' => $value]);
        }

        $scope === self::USER ? self::applyForUser($user) : self::apply();
    }

    public static function registrationOpen(): bool
    {
        try {
            // Open unless an admin switched it off. The very first account can always register.
            $value = self::query(null)->where('key', self::REGISTRATION_KEY)->first()?->value;

            return $value === null || $value === '1';
        } catch (Throwable) {
            return true;
        }
    }

    public static function setRegistrationOpen(bool $open): void
    {
        Setting::updateOrCreate(['user_id' => null, 'key' => self::REGISTRATION_KEY], ['value' => $open ? '1' : '0']);
    }
}
