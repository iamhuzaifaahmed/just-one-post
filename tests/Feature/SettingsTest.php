<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\AppSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_are_saved_encrypted_and_override_config(): void
    {
        $this->actingAs(User::factory()->create())->put('/settings', [
            'linkedin_client_id' => 'li-id',
            'linkedin_client_secret' => 'li-secret',
            'display_timezone' => 'Asia/Dhaka',
            'public_base_url' => 'https://example.com',
        ])->assertRedirect();

        $raw = \DB::table('settings')->where('key', 'linkedin_client_secret')->value('value');
        $this->assertStringNotContainsString('li-secret', $raw);

        config(['services.linkedin-openid.client_id' => 'env-value']);
        AppSettings::apply();
        $this->assertSame('li-id', config('services.linkedin-openid.client_id'));
        $this->assertSame('li-secret', config('services.linkedin-openid.client_secret'));
        $this->assertSame('https://example.com', config('social.public_base_url'));
        $this->assertStringEndsWith('/connections/linkedin/callback', config('services.linkedin-openid.redirect'));
    }

    public function test_blank_secret_keeps_stored_value_and_page_never_exposes_it(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->put('/settings', ['google_client_secret' => 'g-secret']);
        $this->actingAs($user)->put('/settings', ['google_client_secret' => '', 'google_client_id' => 'gid']);

        AppSettings::apply();
        $this->assertSame('g-secret', config('services.google.client_secret'));

        $this->actingAs($user)->get('/settings')
            ->assertOk()
            ->assertDontSee('g-secret');
    }

    public function test_invalid_timezone_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->put('/settings', ['display_timezone' => 'Mars/Base'])
            ->assertSessionHasErrors('display_timezone');
    }
}
