<?php

namespace App\Services\Publishers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

abstract class BasePublisher implements Publisher
{
    protected function http(int $timeout = 60): PendingRequest
    {
        return Http::timeout($timeout)->connectTimeout(15)->acceptJson();
    }

    /**
     * Run a request, translating transport failures and API errors into PublishExceptions.
     * Only status and error body are logged, never request headers or tokens.
     *
     * @param  callable(): Response  $request
     */
    protected function send(callable $request, string $what): Response
    {
        try {
            $response = $request();
        } catch (ConnectionException $e) {
            throw new PublishException("$what: network error, will retry.");
        }

        if ($response->successful()) {
            return $response;
        }

        $detail = $this->errorDetail($response);
        Log::warning("[{$this->name()}] $what failed", ['status' => $response->status(), 'error' => $detail]);

        $status = $response->status();
        if ($status === 401 || $this->isAuthError($response)) {
            throw PublishException::reconnect("$what: authorization rejected ($detail). Reconnect the account.");
        }
        if ($status === 429 || $status >= 500) {
            throw new PublishException("$what: HTTP $status ($detail)");
        }

        throw PublishException::permanent("$what: HTTP $status ($detail)");
    }

    protected function isAuthError(Response $response): bool
    {
        return false;
    }

    protected function errorDetail(Response $response): string
    {
        $json = $response->json();
        $msg = data_get($json, 'error.message')
            ?? data_get($json, 'error_description')
            ?? data_get($json, 'description')   // Telegram
            ?? data_get($json, 'detail')        // X
            ?? data_get($json, 'message')       // Discord, WordPress, LinkedIn
            ?? (is_string(data_get($json, 'error')) ? data_get($json, 'error') : null)
            ?? mb_substr($response->body(), 0, 300);

        return mb_substr((string) $msg, 0, 400);
    }

    /**
     * Media URL that the platform's own servers must be able to download (Instagram, Threads).
     *
     * @throws PublishException
     */
    protected function publicMediaUrl(\App\Models\Post $post, string $platformLabel): string
    {
        $url = $post->mediaPublicUrl();
        if (! $url) {
            throw PublishException::permanent("$platformLabel requires an image or a video.");
        }
        if (preg_match('#^https?://(localhost|127\.|\[::1\]|[^/:]*\.test)([/:]|$)#i', $url)) {
            throw PublishException::permanent(
                "$platformLabel must fetch the media from a public URL, but it is \"$url\". Set the Public base URL in Settings to a tunnel (ngrok/cloudflared) or your live domain."
            );
        }

        return $url;
    }

    abstract protected function name(): string;
}
