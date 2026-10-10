<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuideController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $host = parse_url(url('/'), PHP_URL_HOST);

        return Inertia::render('Guide/Index', [
            'tab' => $request->query('tab', 'start'),
            'appUrl' => rtrim(url('/'), '/'),
            'isLocal' => in_array($host, ['localhost', '127.0.0.1', '[::1]'], true) || str_ends_with((string) $host, '.test'),
            'redirects' => [
                'linkedin' => url('/connections/linkedin/callback'),
                'facebook' => url('/connections/facebook/callback'),
                'youtube' => url('/connections/youtube/callback'),
                'threads' => url('/connections/threads/callback'),
                'x' => url('/connections/x/callback'),
            ],
            'publicBaseUrl' => config('social.public_base_url'),
        ]);
    }
}
