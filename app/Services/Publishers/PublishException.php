<?php

namespace App\Services\Publishers;

use RuntimeException;

class PublishException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly bool $retryable = true,
        public readonly bool $needsReconnect = false,
    ) {
        parent::__construct($message);
    }

    /** Permanent failure (validation, bad request): retrying will not help. */
    public static function permanent(string $message): self
    {
        return new self($message, retryable: false);
    }

    /** Token invalid/expired/revoked: user must reconnect the account. */
    public static function reconnect(string $message): self
    {
        return new self($message, retryable: false, needsReconnect: true);
    }
}
