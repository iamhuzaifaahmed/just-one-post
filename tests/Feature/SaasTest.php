<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\PostTarget;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\AppSettings;
use App\Services\TokenManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SaasTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $name = 'User', bool $admin = false): User
    {
        $u = User::factory()->create(['name' => $name, 'email' => strtolower($name).'@example.com']);
        $u->forceFill(['is_admin' => $admin])->save();

        return $u;
    }

    /** @return array{0: SocialAccount, 1: Post, 2: PostTarget} */
    private function content(User $owner, string $platform = 'linkedin'): array
    {
        $account = SocialAccount::create([
            'user_id' => $owner->id, 'platform' => $platform, 'external_id' => 'ext-'.$owner->id,
            'display_name' => "{$owner->name}'s account", 'access_token' => 't',
        ]);
        $post = Post::create(['user_id' => $owner->id, 'body' => "{$owner->name}'s post", 'scheduled_at' => now()->addDay()]);
        $target = $post->targets()->create(['social_account_id' => $account->id, 'status' => 'scheduled', 'run_at' => $post->scheduled_at]);

        return [$account, $post, $target];
    }

    /* ------------------------------ registration ------------------------------ */

    public function test_anyone_can_register_and_gets_a_regular_account(): void
    {
        $this->user('Existing', admin: true);

        $this->get('/register')->assertOk();
        $this->post('/register', [
            'name' => 'New Person', 'email' => 'new@example.com', 'password' => 'a-good-password-1', 'password_confirmation' => 'a-good-password-1',
        ])->assertRedirect('/dashboard');

        $new = User::where('email', 'new@example.com')->firstOrFail();
        $this->assertFalse($new->is_admin);
        $this->assertAuthenticatedAs($new);
    }

    public function test_the_first_account_ever_registered_becomes_the_admin(): void
    {
        $this->post('/register', [
            'name' => 'Owner', 'email' => 'owner@example.com', 'password' => 'a-good-password-1', 'password_confirmation' => 'a-good-password-1',
        ])->assertRedirect('/dashboard');

        $this->assertTrue(User::firstOrFail()->is_admin);
    }

    public function test_an_admin_can_close_registration(): void
    {
        $admin = $this->user('Boss', admin: true);

        $this->actingAs($admin)->put('/admin/settings', ['registration_open' => false])->assertRedirect();
        $this->assertFalse(AppSettings::registrationOpen());
        auth()->logout();

        $this->get('/register')->assertNotFound();
        $this->post('/register', ['name' => 'X', 'email' => 'x@example.com', 'password' => 'a-good-password-1', 'password_confirmation' => 'a-good-password-1'])
            ->assertNotFound();
        $this->get('/login')->assertInertia(fn (Assert $p) => $p->where('canRegister', false));

        AppSettings::setRegistrationOpen(true);
        $this->get('/register')->assertOk();
    }

    public function test_the_root_url_sends_guests_to_login_and_users_to_the_dashboard(): void
    {
        $this->get('/')->assertRedirect('/login');
        $this->actingAs($this->user())->get('/')->assertRedirect('/dashboard');
    }

    /* ------------------------------ tenant isolation ------------------------------ */

    public function test_users_only_see_their_own_posts_and_accounts(): void
    {
        $alice = $this->user('Alice');
        $bob = $this->user('Bob');
        $this->content($alice);
        $this->content($bob);

        $this->actingAs($alice)->get('/posts?tab=all')->assertInertia(fn (Assert $p) => $p
            ->has('posts.data', 1)->where('posts.data.0.body', "Alice's post"));
        $this->actingAs($alice)->get('/connections')->assertInertia(fn (Assert $p) => $p
            ->has('accounts', 1)->where('accounts.0.display_name', "Alice's account"));
        $this->actingAs($bob)->get('/dashboard')->assertInertia(fn (Assert $p) => $p
            ->where('counts.accounts', 1)->where('counts.upcoming', 1));
    }

    public function test_a_user_cannot_touch_someone_elses_records(): void
    {
        $alice = $this->user('Alice');
        $mallory = $this->user('Mallory');
        [$account, $post, $target] = $this->content($alice);
        $target->update(['status' => 'failed']);

        $this->actingAs($mallory);
        $this->get("/posts/{$post->id}/edit")->assertNotFound();
        $this->post("/posts/{$post->id}", ['body' => 'hacked', 'targets' => [$account->id => ['selected' => 1]]])->assertNotFound();
        $this->post("/posts/{$post->id}/cancel")->assertNotFound();
        $this->post("/targets/{$target->id}/retry")->assertNotFound();
        $this->patch("/connections/{$account->id}", ['label' => 'mine now'])->assertNotFound();
        $this->delete("/connections/{$account->id}")->assertNotFound();

        $this->assertSame('failed', $target->fresh()->status);
        $this->assertNull($account->fresh()->label);
        $this->assertNotNull($account->fresh());
        $this->assertSame("Alice's post", $post->fresh()->body);
    }

    public function test_a_post_cannot_be_published_to_someone_elses_account(): void
    {
        $alice = $this->user('Alice');
        $mallory = $this->user('Mallory');
        [$aliceAccount] = $this->content($alice);

        $this->actingAs($mallory)->post('/posts', [
            'body' => 'sneaky', 'scheduled_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'targets' => [$aliceAccount->id => ['selected' => 1]],
        ])->assertSessionHasErrors('targets');

        $this->assertSame(0, Post::withoutGlobalScopes()->where('body', 'sneaky')->count());
    }

    public function test_the_same_external_account_can_be_connected_by_two_users(): void
    {
        $alice = $this->user('Alice');
        $bob = $this->user('Bob');

        foreach ([$alice, $bob] as $u) {
            SocialAccount::create(['user_id' => $u->id, 'platform' => 'facebook', 'external_id' => 'page-1', 'display_name' => 'Shared page', 'access_token' => 't']);
        }

        $this->assertSame(2, SocialAccount::withoutGlobalScopes()->where('external_id', 'page-1')->count());
    }

    /* ------------------------------ suspension ------------------------------ */

    public function test_a_suspended_user_is_signed_out_on_the_next_request(): void
    {
        $user = $this->user('Sam');
        $user->forceFill(['suspended_at' => now()])->save();

        $this->actingAs($user)->get('/dashboard')->assertRedirect('/login');
        $this->assertGuest();
    }

    /* ------------------------------ admin panel ------------------------------ */

    public function test_the_admin_panel_is_hidden_from_regular_users_and_guests(): void
    {
        $this->get('/admin')->assertRedirect('/login');
        $this->actingAs($this->user('Regular'))->get('/admin')->assertNotFound();
        $this->get('/admin/users')->assertNotFound();
        $this->put('/admin/settings', ['registration_open' => false])->assertNotFound();
        $this->assertTrue(AppSettings::registrationOpen());
    }

    public function test_admin_overview_counts_everyone_and_users_page_lists_all(): void
    {
        $admin = $this->user('Boss', admin: true);
        $alice = $this->user('Alice');
        $bob = $this->user('Bob');
        $this->content($alice);
        [, , $failed] = $this->content($bob);
        $failed->update(['status' => 'failed', 'error' => 'boom']);

        $this->actingAs($admin)->get('/admin')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->component('Admin/Dashboard')
            ->where('users.total', 3)
            ->where('accountsByPlatform.linkedin', 2)
            ->has('failures', 1)->where('failures.0.user', 'bob@example.com')->where('failures.0.error', 'boom'));

        $this->actingAs($admin)->get('/admin/users')->assertInertia(fn (Assert $p) => $p
            ->has('users.data', 3));
        $this->actingAs($admin)->get('/admin/users?q=ali')->assertInertia(fn (Assert $p) => $p
            ->has('users.data', 1)->where('users.data.0.email', 'alice@example.com')->where('users.data.0.accounts', 1));
    }

    public function test_admin_can_suspend_unsuspend_and_promote_users(): void
    {
        $admin = $this->user('Boss', admin: true);
        $alice = $this->user('Alice');

        $this->actingAs($admin)->post("/admin/users/{$alice->id}/suspend")->assertRedirect();
        $this->assertTrue($alice->fresh()->isSuspended());
        $this->actingAs($admin)->post("/admin/users/{$alice->id}/unsuspend");
        $this->assertFalse($alice->fresh()->isSuspended());

        $this->actingAs($admin)->post("/admin/users/{$alice->id}/admin");
        $this->assertTrue($alice->fresh()->is_admin);
        $this->actingAs($admin)->post("/admin/users/{$alice->id}/admin");
        $this->assertFalse($alice->fresh()->is_admin);
    }

    public function test_admin_cannot_lock_themselves_out(): void
    {
        $admin = $this->user('Boss', admin: true);

        $this->actingAs($admin)->post("/admin/users/{$admin->id}/suspend")->assertSessionHas('error');
        $this->actingAs($admin)->post("/admin/users/{$admin->id}/admin")->assertSessionHas('error');
        $this->actingAs($admin)->delete("/admin/users/{$admin->id}")->assertSessionHas('error');

        $fresh = $admin->fresh();
        $this->assertTrue($fresh->is_admin);
        $this->assertFalse($fresh->isSuspended());
    }

    public function test_deleting_a_user_removes_their_data_and_uploads_but_not_other_users(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('media/alice.jpg', 'x');
        Storage::disk('public')->put('media/bob.jpg', 'y');
        $admin = $this->user('Boss', admin: true);
        $alice = $this->user('Alice');
        $bob = $this->user('Bob');
        [, $alicePost] = $this->content($alice);
        [, $bobPost] = $this->content($bob);
        $alicePost->forceFill(['media_path' => 'media/alice.jpg', 'media_type' => 'image'])->save();
        $bobPost->forceFill(['media_path' => 'media/bob.jpg', 'media_type' => 'image'])->save();

        $this->actingAs($admin)->delete("/admin/users/{$alice->id}")->assertRedirect()->assertSessionHas('success');

        $this->assertNull(User::find($alice->id));
        $this->assertSame(0, SocialAccount::withoutGlobalScopes()->where('user_id', $alice->id)->count());
        $this->assertSame(0, Post::withoutGlobalScopes()->where('user_id', $alice->id)->count());
        $this->assertSame(0, PostTarget::withoutGlobalScopes()->whereDoesntHave('post', fn ($q) => $q->withoutGlobalScopes())->count());
        Storage::disk('public')->assertMissing('media/alice.jpg');
        Storage::disk('public')->assertExists('media/bob.jpg');
        $this->assertSame(1, Post::withoutGlobalScopes()->where('user_id', $bob->id)->count());
    }

    public function test_global_settings_can_only_be_changed_by_an_admin_and_apply_app_wide(): void
    {
        $admin = $this->user('Boss', admin: true);

        $this->actingAs($admin)->put('/admin/settings', [
            'registration_open' => true, 'public_base_url' => 'https://app.example.com', 'meta_graph_version' => 'v25.0',
        ])->assertRedirect();

        config(['social.public_base_url' => null]);
        AppSettings::apply();
        $this->assertSame('https://app.example.com', config('social.public_base_url'));
    }

    /* ------------------------------ workers use the owner's own keys ------------------------------ */

    public function test_token_refresh_uses_the_credentials_of_the_account_owner(): void
    {
        $alice = $this->user('Alice');
        $bob = $this->user('Bob');
        $this->actingAs($alice)->put('/settings', ['x_client_id' => 'alice-id', 'x_client_secret' => 'alice-secret']);
        $this->actingAs($bob)->put('/settings', ['x_client_id' => 'bob-id', 'x_client_secret' => 'bob-secret']);
        auth()->logout();
        AppSettings::applyForUser(null);

        Http::fake(['api.x.com/2/oauth2/token' => Http::response(['access_token' => 'new', 'refresh_token' => 'r2', 'expires_in' => 7200])]);

        // A queue worker handles Bob's account right after Alice's, with nobody signed in.
        foreach ([$alice, $bob] as $owner) {
            $account = SocialAccount::create([
                'user_id' => $owner->id, 'platform' => 'x', 'external_id' => 'x-'.$owner->id, 'display_name' => '@'.$owner->name,
                'access_token' => 'old', 'refresh_token' => 'r1', 'token_expires_at' => now()->subMinute(),
            ]);
            app(TokenManager::class)->ensureFresh($account);
        }

        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'Basic '.base64_encode('alice-id:alice-secret')));
        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'Basic '.base64_encode('bob-id:bob-secret')));
    }

    public function test_the_scheduler_dispatches_due_posts_of_all_users_and_records_a_heartbeat(): void
    {
        \Illuminate\Support\Facades\Queue::fake();
        $alice = $this->user('Alice');
        $bob = $this->user('Bob');
        foreach ([$alice, $bob] as $u) {
            [, $post, $target] = $this->content($u);
            $post->forceFill(['scheduled_at' => now()->subMinute()])->save();
            $target->forceFill(['run_at' => now()->subMinute()])->save();
        }

        $this->artisan('posts:dispatch-due')->assertSuccessful();

        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\PublishTargetJob::class, 2);
        $admin = $this->user('Boss', admin: true);
        $this->actingAs($admin)->get('/admin')->assertInertia(fn (Assert $p) => $p->where('scheduler.healthy', true));
    }

    public function test_the_only_admin_cannot_delete_their_own_account(): void
    {
        $admin = $this->user('Boss', admin: true);

        $this->actingAs($admin)->delete('/profile', ['password' => 'password'])
            ->assertSessionHasErrors('password', errorBag: 'userDeletion');

        $this->assertNotNull(User::find($admin->id));
    }

    public function test_a_regular_user_can_delete_their_own_account_and_data(): void
    {
        $alice = $this->user('Alice');
        $this->content($alice);

        $this->actingAs($alice)->delete('/profile', ['password' => 'password'])->assertRedirect('/');

        $this->assertNull(User::find($alice->id));
        $this->assertSame(0, Post::withoutGlobalScopes()->count());
        $this->assertSame(0, SocialAccount::withoutGlobalScopes()->count());
    }
}
