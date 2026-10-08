<?php

namespace App\Services\Publishers;

class PublisherFactory
{
    public static function make(string $platform): Publisher
    {
        return match ($platform) {
            'linkedin' => new LinkedInPublisher,
            'facebook' => new FacebookPublisher,
            'instagram' => new InstagramPublisher,
            'youtube' => new YouTubePublisher,
            default => throw PublishException::permanent("Unsupported platform: $platform"),
        };
    }
}
