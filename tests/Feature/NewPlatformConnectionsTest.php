<?php

namespace Tests\Feature;

use App\Models\SocialAccount;
use App\Models\User;
use App\Services\TokenManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Tests\Concerns\MakesPosts;
use Tests\TestCase;

class NewPlatformConnectionsTest extends TestCase
{
    use MakesPosts, RefreshDatabase;

    private function me(): User
    {
        return $this->owner();
    }

    /* ------------------------------ Telegram ------------------------------ */

    private const TOKEN = '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw';

    public function test_telegram_channel_is_validated_and_saved(): void
    {
        Http::fake([
            'api.telegram.org/bot*/getMe' => Http::response(['ok' => true, 'result' => ['id' => 123456789, 'username' => 'my_bot']]),
            // getChatMember must be listed first: the getChat* pattern would also match it.
            'api.telegram.org/bot*/getChatMember*' => Http::response(['ok' => true, 'result' => ['status' => 'administrator', 'can_post_messages' => true]]),
            'api.telegram.org/bot*/getChat*' => Http::response(['ok' => true, 'result' => ['id' => -1001234567890, 'type' => 'channel', 'title' => 'My Channel']]),
        ]);

        $this->actingAs($this->me())
            ->post('/connections/telegram', ['bot_token' => self::TOKEN, 'chat_id' => 'mychannel'])
            ->assertRedirect('/connections')->assertSessionHas('success');

        $a = SocialAccount::firstOrFail();
        $this->assertSame('telegram', $a->platform);
        $this->assertSame('My Channel', $a->display_name);
        $this->assertSame('-1001234567890', $a->external_id);
        $this->assertSame('-1001234567890', $a->meta['chat_id']);
        $this->assertSame(self::TOKEN, $a->access_token);
        // The username was normalised to @mychannel before asking Telegram.
        Http::assertSent(fn (Request $r) => str_contains($r->url(), '/getChat') && $r['chat_id'] === '@mychannel');
        // The token is encrypted at rest.
        $this->assertStringNotContainsString('AAHdq', (string) \DB::table('social_accounts')->value('access_token'));
    }

    public function test_telegram_rejects_a_bot_that_is_not_a_channel_admin_and_bad_tokens(): void
    {
        Http::fake([
            'api.telegram.org/bot*/getMe' => Http::response(['ok' => true, 'result' => ['id' => 1, 'username' => 'b']]),
            'api.telegram.org/bot*/getChatMember*' => Http::response(['ok' => true, 'result' => ['status' => 'member']]),
            'api.telegram.org/bot*/getChat*' => Http::response(['ok' => true, 'result' => ['id' => -100, 'type' => 'channel', 'title' => 'C']]),
        ]);
        $me = $this->me();

        $this->actingAs($me)->post('/connections/telegram', ['bot_token' => self::TOKEN, 'chat_id' => '@c'])
            ->assertSessionHasErrors('chat_id');
        $this->actingAs($me)->post('/connections/telegram', ['bot_token' => 'not-a-token', 'chat_id' => '@c'])
            ->assertSessionHasErrors('bot_token');
        $this->assertSame(0, SocialAccount::count());
    }

    /* ------------------------------ Discord ------------------------------ */

    public function test_discord_webhook_is_validated_and_saved_encrypted(): void
    {
        $url = 'https://discord.com/api/webhooks/555000111/abc-DEF_123';
        Http::fake(['discord.com/api/webhooks/555000111/*' => Http::response(['id' => '555000111', 'name' => 'Announcements', 'channel_id' => '42', 'guild_id' => '7'])]);

        $this->actingAs($this->me())->post('/connections/discord', ['webhook_url' => $url])
            ->assertRedirect('/connections')->assertSessionHas('success');

        $a = SocialAccount::firstOrFail();
        $this->assertSame('Announcements', $a->display_name);
        $this->assertSame($url, $a->access_token);
        $this->assertStringNotContainsString('abc-DEF', (string) \DB::table('social_accounts')->value('access_token'));
    }

    public function test_discord_rejects_non_webhook_urls(): void
    {
        $this->actingAs($this->me())->post('/connections/discord', ['webhook_url' => 'https://evil.example.com/api/webhooks/1/x'])
            ->assertSessionHasErrors('webhook_url');
        Http::assertNothingSent();
    }

    /* ------------------------------ WordPress ------------------------------ */

    public function test_wordpress_site_is_validated_with_the_application_password(): void
    {
        Http::fake([
            'blog.example.com/wp-json/wp/v2/users/me*' => Http::response(['id' => 7, 'slug' => 'editor', 'capabilities' => ['publish_posts' => true]]),
            'blog.example.com/wp-json' => Http::response(['name' => 'My Blog']),
        ]);

        $this->actingAs($this->me())->post('/connections/wordpress', [
            'site_url' => 'blog.example.com/', 'username' => 'editor', 'app_password' => 'abcd efgh ijkl mnop',
        ])->assertRedirect('/connections')->assertSessionHas('success');

        $a = SocialAccount::firstOrFail();
        $this->assertSame('wordpress', $a->platform);
        $this->assertSame('My Blog (@editor)', $a->display_name);
        $this->assertSame('https://blog.example.com', $a->meta['site_url']);
        $this->assertSame('abcd efgh ijkl mnop', $a->access_token);
        Http::assertSent(fn (Request $r) => str_contains($r->url(), '/users/me')
            && $r->hasHeader('Authorization', 'Basic '.base64_encode('editor:abcd efgh ijkl mnop')));
    }

    public function test_wordpress_wrong_password_is_reported_on_the_password_field(): void
    {
        Http::fake(['blog.example.com/*' => Http::response(['code' => 'incorrect_password'], 401)]);

        $this->actingAs($this->me())->post('/connections/wordpress', [
            'site_url' => 'https://blog.example.com', 'username' => 'editor', 'app_password' => 'nope',
        ])->assertSessionHasErrors('app_password');
        $this->assertSame(0, SocialAccount::count());
    }

    /* ------------------------------ Threads OAuth ------------------------------ */

    public function test_threads_redirect_sends_the_publish_scope_and_a_state(): void
    {
        config(['services.threads.client_id' => 'thr-app', 'services.threads.redirect' => 'http://localhost:8000/connections/threads/callback']);

        $res = $this->actingAs($this->me())->get('/connections/threads/redirect');

        $res->assertRedirectContains('https://threads.com/oauth/authorize');
        $location = $res->headers->get('Location');
        parse_str(parse_url($location, PHP_URL_QUERY), $q);
        $this->assertSame('thr-app', $q['client_id']);
        $this->assertSame('threads_basic,threads_content_publish', $q['scope']);
        $this->assertSame(session('threads_oauth_state'), $q['state']);
    }

    public function test_threads_callback_exchanges_for_a_long_lived_token(): void
    {
        config(['services.threads.client_id' => 'thr-app', 'services.threads.client_secret' => 'thr-secret']);
        Http::fake([
            'graph.threads.net/oauth/access_token' => Http::response(['access_token' => 'short-tok', 'user_id' => 90001]),
            'graph.threads.net/access_token*' => Http::response(['access_token' => 'long-tok', 'expires_in' => 5183944]),
            'graph.threads.net/v1.0/me*' => Http::response(['id' => '90001', 'username' => 'huzaifa']),
        ]);

        $this->actingAs($this->me())->withSession(['threads_oauth_state' => 'state-123'])
            ->get('/connections/threads/callback?code=abc&state=state-123')
            ->assertRedirect('/connections')->assertSessionHas('success');

        $a = SocialAccount::firstOrFail();
        $this->assertSame('threads', $a->platform);
        $this->assertSame('90001', $a->external_id);
        $this->assertSame('@huzaifa', $a->display_name);
        $this->assertSame('long-tok', $a->access_token);
        $this->assertTrue($a->token_expires_at->isAfter(now()->addDays(59)));
        $this->assertTrue($a->canAutoRefresh());
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/oauth/access_token') && $r['code'] === 'abc' && $r['grant_type'] === 'authorization_code');
    }

    public function test_threads_callback_rejects_a_wrong_state(): void
    {
        Http::fake();

        $this->actingAs($this->me())->withSession(['threads_oauth_state' => 'right'])
            ->get('/connections/threads/callback?code=abc&state=wrong')
            ->assertRedirect('/connections')->assertSessionHas('error');

        Http::assertNothingSent();
        $this->assertSame(0, SocialAccount::count());
    }

    /* ------------------------------ X OAuth ------------------------------ */

    public function test_x_callback_stores_access_and_refresh_tokens(): void
    {
        $u = new \Laravel\Socialite\Two\User;
        $u->id = '2244994945';
        $u->nickname = 'huzaifa_x';
        $u->name = 'Huzaifa';
        $u->token = 'x-access';
        $u->refreshToken = 'x-refresh';
        $u->expiresIn = 7200;

        $provider = \Mockery::mock(\Laravel\Socialite\Contracts\Provider::class);
        $provider->shouldReceive('user')->andReturn($u);
        Socialite::shouldReceive('driver')->with('x')->andReturn($provider);

        $this->actingAs($this->me())->get('/connections/x/callback?code=abc')->assertRedirect('/connections');

        $a = SocialAccount::firstOrFail();
        $this->assertSame('x', $a->platform);
        $this->assertSame('@huzaifa_x', $a->display_name);
        $this->assertSame('x-refresh', $a->refresh_token);
        $this->assertNotNull($a->token_expires_at);
    }

    /* ------------------------------ token refresh ------------------------------ */

    public function test_x_token_is_refreshed_with_basic_auth_and_rotated(): void
    {
        config(['services.x.client_id' => 'xid', 'services.x.client_secret' => 'xsecret']);
        Http::fake(['api.x.com/2/oauth2/token' => Http::response(['access_token' => 'new-access', 'refresh_token' => 'new-refresh', 'expires_in' => 7200])]);
        $account = $this->account('x', ['refresh_token' => 'old-refresh', 'token_expires_at' => now()->subMinute()]);

        app(TokenManager::class)->ensureFresh($account);

        $account->refresh();
        $this->assertSame('new-access', $account->access_token);
        $this->assertSame('new-refresh', $account->refresh_token);
        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'Basic '.base64_encode('xid:xsecret'))
            && $r['grant_type'] === 'refresh_token' && $r['refresh_token'] === 'old-refresh');
    }

    public function test_threads_token_refreshes_itself_when_close_to_expiry(): void
    {
        Http::fake(['graph.threads.net/refresh_access_token*' => Http::response(['access_token' => 'fresh-long', 'expires_in' => 5184000])]);
        $account = $this->account('threads', ['token_expires_at' => now()->addDays(3)]);

        app(TokenManager::class)->refreshExpiring();

        $account->refresh();
        $this->assertSame('fresh-long', $account->access_token);
        $this->assertTrue($account->token_expires_at->isAfter(now()->addDays(59)));
        Http::assertSent(fn (Request $r) => $r['grant_type'] === 'th_refresh_token' && $r['access_token'] === 'secret-access-token');
    }

    public function test_failed_threads_refresh_flags_the_account(): void
    {
        Http::fake(['graph.threads.net/refresh_access_token*' => Http::response(['error' => ['message' => 'expired']], 400)]);
        $account = $this->account('threads', ['token_expires_at' => now()->subHour()]);

        try {
            app(TokenManager::class)->ensureFresh($account);
        } catch (\App\Services\Publishers\PublishException $e) {
            $this->assertTrue($e->needsReconnect);
        }
        $this->assertSame('needs_reconnect', $account->fresh()->status);
    }

}
