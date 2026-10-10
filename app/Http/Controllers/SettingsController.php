<?php

namespace App\Http\Controllers;

use App\Services\AppSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** A user's own developer-app credentials (bring your own keys) and display timezone. */
class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Settings/Index', [
            'fields' => AppSettings::forForm(AppSettings::USER),
            'redirects' => [
                'linkedin' => url('/connections/linkedin/callback'),
                'facebook' => url('/connections/facebook/callback'),
                'youtube' => url('/connections/youtube/callback'),
                'threads' => url('/connections/threads/callback'),
                'x' => url('/connections/x/callback'),
            ],
            'timezones' => \DateTimeZone::listIdentifiers(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'linkedin_client_id' => ['nullable', 'string', 'max:255'],
            'linkedin_client_secret' => ['nullable', 'string', 'max:255'],
            'facebook_client_id' => ['nullable', 'string', 'max:255'],
            'facebook_client_secret' => ['nullable', 'string', 'max:255'],
            'google_client_id' => ['nullable', 'string', 'max:255'],
            'google_client_secret' => ['nullable', 'string', 'max:255'],
            'threads_client_id' => ['nullable', 'string', 'max:255'],
            'threads_client_secret' => ['nullable', 'string', 'max:255'],
            'x_client_id' => ['nullable', 'string', 'max:255'],
            'x_client_secret' => ['nullable', 'string', 'max:255'],
            'display_timezone' => ['nullable', Rule::in(\DateTimeZone::listIdentifiers())],
        ]);

        AppSettings::save($data, AppSettings::USER, $request->user());

        return back()->with('success', 'Settings saved.');
    }
}
