<?php

namespace App\Http\Controllers;

use App\Services\AppSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Settings/Index', [
            'fields' => AppSettings::forForm(),
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
            'public_base_url' => ['nullable', 'url', 'max:255'],
            'display_timezone' => ['nullable', Rule::in(\DateTimeZone::listIdentifiers())],
            'meta_graph_version' => ['nullable', 'regex:/^v\d+\.\d+$/'],
            'linkedin_api_version' => ['nullable', 'regex:/^\d{6}$/'],
            'ffprobe_path' => ['nullable', 'string', 'max:255'],
        ]);

        AppSettings::save($data);

        return back()->with('success', 'Settings saved.');
    }
}
