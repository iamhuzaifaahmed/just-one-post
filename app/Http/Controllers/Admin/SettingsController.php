<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AppSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** App-wide options. Only admins can reach this. */
class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Settings', [
            'fields' => AppSettings::forForm(AppSettings::GLOBAL),
            'registrationOpen' => AppSettings::registrationOpen(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'registration_open' => ['required', 'boolean'],
            'public_base_url' => ['nullable', 'url', 'max:255'],
            'meta_graph_version' => ['nullable', 'regex:/^v\d+\.\d+$/'],
            'linkedin_api_version' => ['nullable', 'regex:/^\d{6}$/'],
            'ffprobe_path' => ['nullable', 'string', 'max:255'],
        ]);

        AppSettings::setRegistrationOpen((bool) $data['registration_open']);
        AppSettings::save($data, AppSettings::GLOBAL);

        return back()->with('success', 'Admin settings saved.');
    }
}
