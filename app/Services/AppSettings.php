<?php

namespace App\Services;

use App\Models\Setting;
use Throwable;

/**
 * Credentials and options editable from the dashboard (stored encrypted in the DB).
 * Values saved here override the matching .env/config defaults.
 */
class AppSettings
{
    /** key => [config path, is secret, group, label] */
    public const FIELDS = [
        'linkedin_client_id' => ['services.linkedin-openid.client_id', false, 'linkedin', 'Client ID'],
        'linkedin_client_secret' => ['services.linkedin-openid.client_secret', true, 'linkedin', 'Client Secret'],
        'facebook_client_id' => ['services.facebook.client_id', false, 'facebook', 'App ID'],
        'facebook_client_secret' => ['services.facebook.client_secret', true, 'facebook', 'App Secret'],
        'google_client_id' => ['services.google.client_id', false, 'google', 'Client ID'],
        'google_client_secret' => ['services.google.client_secret', true, 'google', 'Client Secret'],
        'threads_client_id' => ['services.threads.client_id', false, 'threads', 'Threads App ID'],
        'threads_client_secret' => ['services.threads.client_secret', true, 'threads', 'Threads App Secret'],
        'x_client_id' => ['services.x.client_id', false, 'x', 'Client ID'],
        'x_client_secret' => ['services.x.client_secret', true, 'x', 'Client Secret'],
        'public_base_url' => ['social.public_base_url', false, 'general', 'Public base URL (for Instagram and Threads media)'],
        'display_timezone' => ['social.display_timezone', false, 'general', 'Display timezone'],
        'meta_graph_version' => ['social.graph_version', false, 'advanced', 'Meta Graph API version'],
        'linkedin_api_version' => ['social.linkedin_version', false, 'advanced', 'LinkedIn API version (YYYYMM)'],
        'ffprobe_path' => ['social.ffprobe_path', false, 'advanced', 'ffprobe path (optional)'],
    ];

    /** OAuth redirect URIs are derived from the current host, not stored. */
    public const REDIRECTS = [
        'services.linkedin-openid.redirect' => '/connections/linkedin/callback',
        'services.facebook.redirect' => '/connections/facebook/callback',
        'services.google.redirect' => '/connections/youtube/callback',
        'services.threads.redirect' => '/connections/threads/callback',
        'services.x.redirect' => '/connections/x/callback',
    ];

    /** Push saved values into config(). Safe to call before migrations have run. */
    public static function apply(): void
    {
        foreach (self::REDIRECTS as $path => $uri) {
            config([$path => url($uri)]);
        }

        try {
            foreach (Setting::all() as $setting) {
                $field = self::FIELDS[$setting->key] ?? null;
                if ($field && filled($setting->value)) {
                    config([$field[0] => $setting->value]);
                }
            }
        } catch (Throwable) {
            // table missing (fresh install / tests) or APP_KEY changed: fall back to .env values
        }
    }

    /** @return array<string,mixed> */
    public static function forForm(): array
    {
        $saved = [];
        try {
            $saved = Setting::pluck('value', 'key')->all();
        } catch (Throwable) {
        }

        $out = [];
        foreach (self::FIELDS as $key => [$path, $secret]) {
            $current = filled($saved[$key] ?? null) ? $saved[$key] : config($path);
            $isPlaceholder = is_string($current) && str_starts_with($current, 'your-');
            $out[$key] = $secret
                ? ['secret' => true, 'set' => filled($current) && ! $isPlaceholder, 'value' => '']
                : ['secret' => false, 'set' => filled($current), 'value' => $isPlaceholder ? '' : (string) $current];
        }

        return $out;
    }

    /** Save submitted values; blank secrets keep the stored value. */
    public static function save(array $input): void
    {
        foreach (self::FIELDS as $key => [, $secret]) {
            if (! array_key_exists($key, $input)) {
                continue;
            }
            $value = trim((string) $input[$key]);
            if ($value === '') {
                if (! $secret) {
                    Setting::where('key', $key)->delete(); // cleared -> fall back to .env default
                }

                continue;
            }
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        self::apply();
    }

    public static function clear(string $key): void
    {
        Setting::where('key', $key)->delete();
    }
}
