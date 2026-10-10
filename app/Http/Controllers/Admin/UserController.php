<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('q', ''));

        $users = User::query()
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%$search%")->orWhere('email', 'like', "%$search%")))
            ->withCount(['socialAccounts', 'posts'])
            ->orderByDesc('is_admin')->latest()
            ->paginate(20)->withQueryString()
            ->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'is_admin' => $u->is_admin,
                'suspended' => $u->isSuspended(),
                'accounts' => $u->social_accounts_count,
                'posts' => $u->posts_count,
                'joined' => $u->created_at?->timezone(config('social.display_timezone'))->format('M j, Y'),
                'is_me' => $u->id === $request->user()->id,
            ]);

        return Inertia::render('Admin/Users', ['users' => $users, 'q' => $search]);
    }

    public function suspend(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot suspend yourself.');
        }
        $user->forceFill(['suspended_at' => now()])->save();

        return back()->with('success', "{$user->email} suspended. They are signed out on their next request.");
    }

    public function unsuspend(User $user): RedirectResponse
    {
        $user->forceFill(['suspended_at' => null])->save();

        return back()->with('success', "{$user->email} can sign in again.");
    }

    /** Promote or demote. The last admin can never be demoted. */
    public function toggleAdmin(Request $request, User $user): RedirectResponse
    {
        if ($user->is_admin && User::where('is_admin', true)->count() <= 1) {
            return back()->with('error', 'There must always be at least one admin.');
        }
        $user->forceFill(['is_admin' => ! $user->is_admin])->save();

        return back()->with('success', $user->is_admin ? "{$user->email} is now an admin." : "{$user->email} is no longer an admin.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot delete your own account here. Use Profile instead.');
        }
        if ($user->is_admin && User::where('is_admin', true)->count() <= 1) {
            return back()->with('error', 'There must always be at least one admin.');
        }

        $email = $user->email;
        $user->delete();

        return back()->with('success', "$email and all of their accounts, posts and uploads were deleted.");
    }
}
