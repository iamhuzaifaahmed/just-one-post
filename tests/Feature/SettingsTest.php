<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use App\Services\AppSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    private function user(bool $admin = false): User
    {
        $u = User::factory()->create();
        $u->forceFill(['is_admin' => $admin])->save();

        return $u;
    }

    public function test_user_credentials_are_saved_encrypted_and_override_config(): void
    {
        $user = $this->user();

        $this->actingAs($user)->put('/settings', [
            'linkedin_client_id' => 'li-id',
            'linkedin_client_secret' => 'li-secret',
            'display_timezone' => 'Asia/Dhaka',
        ])->assertRedirect();

        $row = Setting::where('user_id', $user->id)->where('key', 'linkedin_client_secret')->first();
        $this->assertNotNull($row);
        $this->assertStringNotContainsString('li-secret', (string) \DB::table('settings')->where('id', $row->id)->value('value'));

        config(['services.linkedin-openid.client_id' => 'env-value']);
        AppSettings::applyForUser($user);
        $this->assertSame('li-id', config('services.linkedin-openid.client_id'));
        $this->assertSame('li-secret', config('services.linkedin-openid.client_secret'));
        $this->assertStringEndsWith('/connections/linkedin/callback', config('services.linkedin-openid.redirect'));
    }

    public function test_one_users_keys_never_leak_to_another_user(): void
    {
        config(['services.x.client_secret' => 'server-env-secret']); // what .env would provide
        $alice = $this->user();
        $bob = $this->user();
        $this->actingAs($alice)->put('/settings', ['x_client_id' => 'alice-x', 'x_client_secret' => 'alice-secret']);

        AppSettings::applyForUser($alice);
        $this->assertSame('alice-x', config('services.x.client_id'));

        // Bob has nothing saved: he must not see Alice's keys or the server's .env keys.
        AppSettings::applyForUser($bob);
        $this->assertNull(config('services.x.client_id'));
        $this->assertNull(config('services.x.client_secret'));

        // Switching back restores Alice's values (what a queue worker does between jobs).
        AppSettings::applyForUser($alice);
        $this->assertSame('alice-x', config('services.x.client_id'));
        AppSettings::applyForUser(null);
        $this->assertSame('server-env-secret', config('services.x.client_secret'));
    }

    public function test_admin_keeps_the_servers_env_credentials_as_fallback(): void
    {
        $admin = $this->user(admin: true);
        config(['services.google.client_id' => 'env-google-id']);

        AppSettings::applyForUser($admin);

        $this->assertSame('env-google-id', config('services.google.client_id'));
    }

    public function test_blank_secret_keeps_stored_value_and_page_never_exposes_it(): void
    {
        $user = $this->user();
        $this->actingAs($user)->put('/settings', ['google_client_secret' => 'g-secret']);
        $this->actingAs($user)->put('/settings', ['google_client_secret' => '', 'google_client_id' => 'gid']);

        AppSettings::applyForUser($user);
        $this->assertSame('g-secret', config('services.google.client_secret'));

        $this->actingAs($user)->get('/settings')->assertOk()->assertDontSee('g-secret');
    }

    public function test_threads_and_x_credentials_can_be_saved(): void
    {
        $user = $this->user();
        $this->actingAs($user)->put('/settings', [
            'threads_client_id' => 'tid', 'threads_client_secret' => 'tsec',
            'x_client_id' => 'xid', 'x_client_secret' => 'xsec',
        ])->assertRedirect();

        AppSettings::applyForUser($user);

        $this->assertSame('tid', config('services.threads.client_id'));
        $this->assertSame('xsec', config('services.x.client_secret'));
        $this->assertStringEndsWith('/connections/x/callback', config('services.x.redirect'));
    }

    public function test_users_cannot_change_global_settings_through_their_own_settings_page(): void
    {
        $user = $this->user();

        $this->actingAs($user)->put('/settings', ['public_base_url' => 'https://evil.example.com', 'meta_graph_version' => 'v1.0'])->assertRedirect();

        $this->assertSame(0, Setting::whereNull('user_id')->where('key', 'public_base_url')->count());
        $this->assertSame(0, Setting::where('key', 'public_base_url')->count());
    }

    public function test_invalid_timezone_is_rejected(): void
    {
        $this->actingAs($this->user())
            ->put('/settings', ['display_timezone' => 'Mars/Base'])
            ->assertSessionHasErrors('display_timezone');
    }

    public function test_each_user_gets_their_own_timezone(): void
    {
        config(['social.display_timezone' => 'Asia/Dhaka']); // the app default
        $ny = $this->user();
        $this->actingAs($ny)->put('/settings', ['display_timezone' => 'America/New_York']);
        $other = $this->user();

        AppSettings::applyForUser($ny);
        $this->assertSame('America/New_York', config('social.display_timezone'));

        AppSettings::applyForUser($other);
        $this->assertSame('Asia/Dhaka', config('social.display_timezone'));
    }
}
