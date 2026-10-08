<?php

namespace Tests\Feature;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Tests\TestCase;

class MultiAccountTest extends TestCase
{
    use RefreshDatabase;

    private function fakeUser(string $id, string $name): \Laravel\Socialite\Two\User
    {
        $u = new \Laravel\Socialite\Two\User;
        $u->id = $id;
        $u->name = $name;
        $u->token = "token-$id";
        $u->expiresIn = 3600;

        return $u;
    }

    /** One provider mock that returns the given users one after another. */
    private function mockDriver(string $driver, \Laravel\Socialite\Two\User ...$users): void
    {
        $provider = \Mockery::mock(\Laravel\Socialite\Contracts\Provider::class);
        $provider->shouldReceive('user')->andReturn(...$users);
        Socialite::shouldReceive('driver')->with($driver)->andReturn($provider);
    }

    public function test_two_linkedin_profiles_can_be_connected(): void
    {
        $me = User::factory()->create();

        $this->mockDriver('linkedin-openid', $this->fakeUser('sub-1', 'First Person'), $this->fakeUser('sub-2', 'Second Person'));
        $this->actingAs($me)->get('/connections/linkedin/callback?code=a')->assertRedirect('/connections');
        $this->actingAs($me)->get('/connections/linkedin/callback?code=b')->assertRedirect('/connections');

        $this->assertSame(['First Person', 'Second Person'], SocialAccount::where('platform', 'linkedin')->orderBy('id')->pluck('display_name')->all());
    }

    public function test_two_youtube_channels_are_kept_separately_and_reconnect_does_not_duplicate(): void
    {
        $me = User::factory()->create();

        $this->mockDriver('google', $this->fakeUser('g1', 'Channel One'), $this->fakeUser('g2', 'Channel Two'), $this->fakeUser('g1', 'Channel One'));
        Http::fake(['www.googleapis.com/youtube/v3/channels*' => Http::sequence()
            ->push(['items' => [['id' => 'UC1', 'snippet' => ['title' => 'Channel One']]]])
            ->push(['items' => [['id' => 'UC2', 'snippet' => ['title' => 'Channel Two']]]])
            ->push(['items' => [['id' => 'UC1', 'snippet' => ['title' => 'Channel One']]]])]);
        foreach (range(1, 3) as $i) {
            $this->actingAs($me)->get('/connections/youtube/callback?code=x')->assertRedirect('/connections');
        }

        $this->assertSame(2, SocialAccount::where('platform', 'youtube')->count());
    }

    public function test_facebook_connect_saves_every_page_and_instagram_across_paginated_results(): void
    {
        $me = User::factory()->create();
        config(['services.facebook.client_id' => 'cid', 'services.facebook.client_secret' => 'sec']);

        $user = $this->fakeUser('fb', 'Me');
        $provider = \Mockery::mock(\Laravel\Socialite\Two\FacebookProvider::class);
        $provider->shouldReceive('usingGraphVersion')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($user);
        Socialite::shouldReceive('driver')->with('facebook')->andReturn($provider);

        Http::fake([
            '*/oauth/access_token*' => Http::response(['access_token' => 'long']),
            '*/me/accounts?fields*' => Http::response([
                'data' => [
                    ['id' => 'p1', 'name' => 'Page One', 'access_token' => 'pt1', 'instagram_business_account' => ['id' => 'ig1', 'username' => 'one']],
                    ['id' => 'p2', 'name' => 'Page Two', 'access_token' => 'pt2'],
                ],
                'paging' => ['next' => 'https://graph.facebook.com/v25.0/me/accounts?after=CURSOR'],
            ]),
            '*/me/accounts?after=CURSOR*' => Http::response([
                'data' => [['id' => 'p3', 'name' => 'Page Three', 'access_token' => 'pt3', 'instagram_business_account' => ['id' => 'ig3', 'username' => 'three']]],
            ]),
        ]);

        $this->actingAs($me)->get('/connections/facebook/callback?code=x')->assertRedirect('/connections')->assertSessionMissing('error', null);

        $this->assertSame(3, SocialAccount::where('platform', 'facebook')->count());
        $this->assertSame(2, SocialAccount::where('platform', 'instagram')->count());
        // each Instagram account uses the token of its own Page
        $this->assertSame('pt3', SocialAccount::where('external_id', 'ig3')->first()->access_token);
    }

    public function test_account_can_be_given_a_nickname_which_survives_reconnect(): void
    {
        $me = User::factory()->create();
        $this->mockDriver('linkedin-openid', $this->fakeUser('sub-1', 'First Person'), $this->fakeUser('sub-1', 'First Person'));
        $this->actingAs($me)->get('/connections/linkedin/callback?code=a');
        $account = SocialAccount::firstOrFail();

        $this->actingAs($me)->patch("/connections/{$account->id}", ['label' => 'Personal brand'])->assertRedirect();
        $this->assertSame('Personal brand', $account->fresh()->shown_name);

        $this->actingAs($me)->get('/connections/linkedin/callback?code=b');
        $this->assertSame('Personal brand', $account->fresh()->label);

        $this->actingAs($me)->patch("/connections/{$account->id}", ['label' => ''])->assertRedirect();
        $this->assertSame('First Person', $account->fresh()->shown_name);
    }

    public function test_post_can_target_many_accounts_of_the_same_platform(): void
    {
        $me = User::factory()->create();
        $a = SocialAccount::create(['platform' => 'facebook', 'external_id' => '1', 'display_name' => 'Page A', 'access_token' => 't']);
        $b = SocialAccount::create(['platform' => 'facebook', 'external_id' => '2', 'display_name' => 'Page B', 'access_token' => 't']);

        \Illuminate\Support\Facades\Queue::fake();
        $this->actingAs($me)->post('/posts', [
            'body' => 'Hello both',
            'targets' => [$a->id => ['selected' => 1], $b->id => ['selected' => 1]],
            'action' => 'publish_now',
        ])->assertRedirect('/posts');

        $this->assertSame(2, \App\Models\PostTarget::count());
        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\PublishTargetJob::class, 2);
    }
}
