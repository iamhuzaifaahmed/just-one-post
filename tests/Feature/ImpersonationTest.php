<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ImpersonationTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $name, bool $admin = false): User
    {
        $u = User::factory()->create(['name' => $name, 'email' => strtolower($name).'@example.com']);
        $u->forceFill(['is_admin' => $admin])->save();

        return $u;
    }

    public function test_an_admin_can_sign_in_as_a_user_and_return(): void
    {
        $admin = $this->user('Boss', admin: true);
        $alice = $this->user('Alice');
        Post::create(['user_id' => $alice->id, 'body' => "Alice's secret draft", 'scheduled_at' => now()->addDay()]);

        $this->actingAs($admin)->post("/admin/users/{$alice->id}/impersonate")->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($alice);
        $this->assertSame($admin->id, session('impersonator_id'));

        // Now everything is seen as Alice, with the banner data present.
        $this->get('/posts?tab=all')->assertInertia(fn (Assert $p) => $p
            ->has('posts.data', 1)->where('posts.data.0.body', "Alice's secret draft")
            ->where('impersonating.email', 'alice@example.com')->where('auth.user.id', $alice->id));

        // The admin panel is not reachable while impersonating.
        $this->get('/admin')->assertNotFound();

        $this->post('/impersonate/stop')->assertRedirect('/admin/users');
        $this->assertAuthenticatedAs($admin);
        $this->assertNull(session('impersonator_id'));
        $this->get('/admin')->assertOk();
    }

    public function test_regular_users_and_guests_cannot_start_impersonation(): void
    {
        $alice = $this->user('Alice');
        $bob = $this->user('Bob');

        $this->post("/admin/users/{$bob->id}/impersonate")->assertRedirect('/login');
        $this->actingAs($alice)->post("/admin/users/{$bob->id}/impersonate")->assertNotFound();
        $this->assertAuthenticatedAs($alice);
    }

    public function test_you_cannot_stop_an_impersonation_that_never_started(): void
    {
        $this->actingAs($this->user('Alice'))->post('/impersonate/stop')->assertNotFound();
    }

    public function test_a_forged_session_cannot_turn_a_regular_user_into_an_admin(): void
    {
        $alice = $this->user('Alice');
        $bob = $this->user('Bob');

        // impersonator_id pointing at a non-admin must not give anyone admin rights.
        $this->actingAs($alice)->withSession(['impersonator_id' => $bob->id])->post('/impersonate/stop')->assertNotFound();
        $this->assertAuthenticatedAs($alice);
    }

    public function test_admins_suspended_users_and_yourself_cannot_be_impersonated(): void
    {
        $admin = $this->user('Boss', admin: true);
        $other = $this->user('Other', admin: true);
        $sam = $this->user('Sam');
        $sam->forceFill(['suspended_at' => now()])->save();

        foreach ([$other, $sam, $admin] as $target) {
            $this->actingAs($admin)->post("/admin/users/{$target->id}/impersonate")->assertSessionHas('error');
            $this->assertAuthenticatedAs($admin);
            $this->assertNull(session('impersonator_id'));
        }
    }

    public function test_password_change_and_account_deletion_are_blocked_while_impersonating(): void
    {
        $admin = $this->user('Boss', admin: true);
        $alice = $this->user('Alice');

        $this->actingAs($admin)->post("/admin/users/{$alice->id}/impersonate");

        $this->put('/password', ['current_password' => 'password', 'password' => 'new-password-123', 'password_confirmation' => 'new-password-123'])
            ->assertForbidden();
        $this->delete('/profile', ['password' => 'password'])->assertForbidden();

        $this->assertNotNull(User::find($alice->id));
        $this->assertTrue(\Hash::check('password', $alice->fresh()->password));
    }

    public function test_logging_out_while_impersonating_ends_everything(): void
    {
        $admin = $this->user('Boss', admin: true);
        $alice = $this->user('Alice');

        $this->actingAs($admin)->post("/admin/users/{$alice->id}/impersonate");
        $this->post('/logout')->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull(session('impersonator_id'));
    }
}
