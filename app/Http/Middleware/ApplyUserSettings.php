<?php

namespace App\Http\Middleware;

use App\Services\AppSettings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Loads the signed-in user's own credentials and timezone into config for this request. */
class ApplyUserSettings
{
    public function handle(Request $request, Closure $next): Response
    {
        AppSettings::applyForUser($request->user());

        return $next($request);
    }
}
