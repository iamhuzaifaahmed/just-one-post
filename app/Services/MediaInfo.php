<?php

namespace App\Services;

class MediaInfo
{
    public ?int $width = null;
    public ?int $height = null;
    public ?float $duration = null;
    public int $size = 0;
    public ?string $mime = null;

    public static function read(string $path, string $type): self
    {
        $info = new self;
        $info->size = is_file($path) ? filesize($path) : 0;

        if ($type === 'image') {
            if ($dims = @getimagesize($path)) {
                [$info->width, $info->height] = $dims;
                $info->mime = $dims['mime'] ?? null;
            }

            return $info;
        }

        $ffprobe = config('social.ffprobe_path');
        if ($ffprobe && is_file($ffprobe)) {
            $cmd = escapeshellarg($ffprobe).' -v error -select_streams v:0 -show_entries stream=width,height:format=duration -of json '.escapeshellarg($path);
            $json = json_decode((string) shell_exec($cmd), true);
            $info->width = $json['streams'][0]['width'] ?? null;
            $info->height = $json['streams'][0]['height'] ?? null;
            $info->duration = isset($json['format']['duration']) ? (float) $json['format']['duration'] : null;
        }

        return $info;
    }

    public function ratio(): ?float
    {
        return $this->width && $this->height ? $this->width / $this->height : null;
    }
}
