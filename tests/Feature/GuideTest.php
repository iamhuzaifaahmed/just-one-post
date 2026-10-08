<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GuideTest extends TestCase
{
    use RefreshDatabase;

    public function test_guide_requires_login(): void
    {
        $this->get('/guide')->assertRedirect('/login');
    }

    public function test_guide_exposes_exact_redirect_uris(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/guide?tab=linkedin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guide/Index')
                ->where('tab', 'linkedin')
                ->where('redirects.linkedin', url('/connections/linkedin/callback'))
                ->where('redirects.facebook', url('/connections/facebook/callback'))
                ->where('redirects.youtube', url('/connections/youtube/callback')));
    }
}
