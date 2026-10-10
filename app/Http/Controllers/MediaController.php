<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

/**
 * Serves uploaded media from storage/app/public at /storage/...
 *
 * Normally the "storage" symlink in public/ does this (the web server then serves the file directly and
 * this route is never reached). On hosts where symlinks are disabled the file is served by the app
 * instead, so Instagram/Threads can still download uploaded images and videos.
 */
class MediaController extends Controller
{
    public function show(string $path): BinaryFileResponse
    {
        try {
            $disk = Storage::disk('public');
            // Flysystem refuses paths with ".." and similar tricks (it throws), which becomes a 404.
            abort_unless($disk->exists($path), 404);
            $full = $disk->path($path);
            abort_unless(is_file($full), 404);
        } catch (Throwable $e) {
            abort(404);
        }

        // Range requests (video seeking / large downloads) and ETag are handled by BinaryFileResponse.
        return response()->file($full, ['Cache-Control' => 'public, max-age=86400']);
    }
}
