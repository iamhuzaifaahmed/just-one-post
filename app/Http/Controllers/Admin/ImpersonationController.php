<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * "Log in as" for admins (support / troubleshooting). The real admin's id is kept in the
 * server-side session, every start and stop is logged, and a banner is shown while active.
 */
class ImpersonationController extends Controller
{
    public function start(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();

        if ($user->id === $admin->id) {
            return back()->with('error', 'You are already signed in as yourself.');
        }
        if ($user->is_admin) {
            return back()->with('error', 'You cannot sign in as another admin.');
        }
        if ($user->isSuspended()) {
            return back()->with('error', 'This account is suspended. Unsuspend it first.');
        }

        Log::info('Impersonation started', ['admin_id' => $admin->id, 'admin' => $admin->email, 'user_id' => $user->id, 'user' => $user->email, 'ip' => $request->ip()]);

        $request->session()->put('impersonator_id', $admin->id);
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard')->with('success', "You are now signed in as {$user->name}.");
    }

    public function stop(Request $request): RedirectResponse
    {
        $adminId = $request->session()->get('impersonator_id');
        $admin = $adminId ? User::find($adminId) : null;

        abort_unless($admin && $admin->is_admin && ! $admin->isSuspended(), 404);

        $target = $request->user();
        Log::info('Impersonation stopped', ['admin_id' => $admin->id, 'user_id' => $target?->id]);

        $request->session()->forget('impersonator_id');
        Auth::guard('web')->login($admin);
        $request->session()->regenerate();

        return redirect()->route('admin.users.index')->with('success', 'Back to your own admin account.');
    }
}
