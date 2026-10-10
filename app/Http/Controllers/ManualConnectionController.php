<?php

namespace App\Http\Controllers;

use App\Models\SocialAccount;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

/**
 * Platforms without OAuth: Telegram (bot token + chat), Discord (webhook URL) and WordPress
 * (site URL + application password). Each credential is checked against the real API before
 * it is stored (encrypted).
 */
class ManualConnectionController extends Controller
{
    public function telegram(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'bot_token' => ['required', 'string', 'regex:/^\d{5,}:[A-Za-z0-9_-]{20,}$/'],
            'chat_id' => ['required', 'string', 'max:100'],
        ], ['bot_token.regex' => 'That does not look like a bot token. It looks like 123456789:AAH... (from @BotFather).']);

        $token = trim($data['bot_token']);
        $chat = trim($data['chat_id']);
        if (preg_match('/^[A-Za-z][A-Za-z0-9_]{4,}$/', $chat)) {
            $chat = '@'.$chat; // allow the channel username without @
        }

        $api = rtrim(config('social.telegram_api_base'), '/')."/bot$token";

        $me = $this->call(fn () => Http::timeout(20)->get("$api/getMe"), 'bot_token');
        if (! $me->json('ok')) {
            throw ValidationException::withMessages(['bot_token' => 'Telegram rejected this bot token: '.($me->json('description') ?? 'invalid token')]);
        }

        $chatInfo = $this->call(fn () => Http::timeout(20)->get("$api/getChat", ['chat_id' => $chat]), 'chat_id');
        if (! $chatInfo->json('ok')) {
            throw ValidationException::withMessages(['chat_id' => 'Telegram could not find that chat: '.($chatInfo->json('description') ?? 'unknown chat').'. Add the bot to the channel/group first.']);
        }

        $type = $chatInfo->json('result.type');
        if ($type === 'channel') {
            $member = $this->call(fn () => Http::timeout(20)->get("$api/getChatMember", [
                'chat_id' => $chat, 'user_id' => $me->json('result.id'),
            ]), 'chat_id');
            $status = $member->json('result.status');
            $canPost = $member->json('result.can_post_messages');
            if (! in_array($status, ['administrator', 'creator'], true) || $canPost === false) {
                throw ValidationException::withMessages(['chat_id' => 'The bot must be an administrator of the channel with permission to post messages.']);
            }
        }

        $numericId = (string) $chatInfo->json('result.id');
        $title = $chatInfo->json('result.title') ?: ('@'.$chatInfo->json('result.username')) ?: $numericId;

        $this->save('telegram', $numericId, $title, $token, [
            'chat_id' => $numericId,
            'chat_type' => $type,
            'bot_username' => $me->json('result.username'),
        ]);

        return redirect()->route('connections.index')->with('success', "Telegram “{$title}” connected.");
    }

    public function discord(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'webhook_url' => ['required', 'string', 'regex:~^https://((ptb|canary)\.)?(discord|discordapp)\.com/api/webhooks/\d+/[\w-]+$~'],
        ], ['webhook_url.regex' => 'That does not look like a Discord webhook URL (https://discord.com/api/webhooks/…).']);

        $url = trim($data['webhook_url']);
        $res = $this->call(fn () => Http::timeout(20)->get($url), 'webhook_url');
        if (! $res->successful() || ! $res->json('id')) {
            throw ValidationException::withMessages(['webhook_url' => 'Discord did not accept this webhook (it may have been deleted). Create a new one and try again.']);
        }

        $name = $res->json('name') ?: 'Discord channel';
        $this->save('discord', (string) $res->json('id'), $name, $url, [
            'channel_id' => $res->json('channel_id'),
            'guild_id' => $res->json('guild_id'),
        ]);

        return redirect()->route('connections.index')->with('success', "Discord webhook “{$name}” connected.");
    }

    public function wordpress(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'site_url' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:100'],
            'app_password' => ['required', 'string', 'max:200'],
        ]);

        $site = trim($data['site_url']);
        if (! preg_match('~^https?://~i', $site)) {
            $site = 'https://'.$site;
        }
        $site = rtrim($site, '/');
        $host = parse_url($site, PHP_URL_HOST);
        if (! $host) {
            throw ValidationException::withMessages(['site_url' => 'Enter your site address, for example https://myblog.com']);
        }

        $username = trim($data['username']);
        $password = trim($data['app_password']);

        $me = $this->call(fn () => Http::timeout(30)->withBasicAuth($username, $password)
            ->acceptJson()->get("$site/wp-json/wp/v2/users/me", ['context' => 'edit']), 'site_url');

        if ($me->status() === 401 || $me->status() === 403) {
            throw ValidationException::withMessages(['app_password' => 'WordPress rejected the username or Application Password. Create a new Application Password and paste it exactly (spaces are fine).']);
        }
        if (! $me->successful() || ! $me->json('id')) {
            throw ValidationException::withMessages(['site_url' => 'Could not reach the WordPress REST API at that address (HTTP '.$me->status().'). Check the URL, that the site uses HTTPS, and that the REST API is not blocked by a security plugin.']);
        }

        $caps = $me->json('capabilities', []);
        if (is_array($caps) && $caps !== [] && empty($caps['publish_posts']) && empty($caps['edit_posts'])) {
            throw ValidationException::withMessages(['username' => 'This WordPress user is not allowed to create posts. Use an Author, Editor or Administrator.']);
        }

        $root = $this->call(fn () => Http::timeout(30)->acceptJson()->get("$site/wp-json"), 'site_url');
        $siteName = $root->json('name') ?: $host;
        $display = "$siteName (@{$me->json('slug')})";

        $this->save('wordpress', $host.'#'.$me->json('id'), $display, $password, [
            'site_url' => $site,
            'username' => $username,
            'user_id' => $me->json('id'),
        ]);

        return redirect()->route('connections.index')->with('success', "WordPress site “{$siteName}” connected.");
    }

    /** @param callable(): \Illuminate\Http\Client\Response $request */
    private function call(callable $request, string $field)
    {
        try {
            return $request();
        } catch (ConnectionException $e) {
            // The message may contain a URL with a token, so it is never shown or logged.
            throw ValidationException::withMessages([$field => 'Could not connect. Check the address and your internet connection, then try again.']);
        }
    }

    private function save(string $platform, string $externalId, string $name, string $secret, array $meta): void
    {
        $account = SocialAccount::firstOrNew(['platform' => $platform, 'external_id' => $externalId]);
        $account->fill([
            'display_name' => $name,
            'access_token' => $secret,
            'refresh_token' => null,
            'token_expires_at' => null,
            'meta' => array_merge($account->meta ?? [], $meta),
            'status' => SocialAccount::ACTIVE,
            'status_message' => null,
        ])->save();
    }
}
