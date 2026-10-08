<?php

namespace App\Services\Publishers;

use App\Models\PostTarget;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;

/**
 * Personal-profile posting via the versioned Posts API (https://api.linkedin.com/rest/posts).
 * Requires the "Share on LinkedIn" product (w_member_social).
 */
class LinkedInPublisher extends BasePublisher
{
    private const API = 'https://api.linkedin.com/rest';
    private const CHUNK = 4194304; // video parts are 4 MB

    protected function name(): string
    {
        return 'linkedin';
    }

    protected function isAuthError(Response $response): bool
    {
        return in_array($response->json('code'), ['REVOKED_ACCESS_TOKEN', 'EXPIRED_ACCESS_TOKEN', 'INVALID_ACCESS_TOKEN'], true)
            || $response->json('serviceErrorCode') === 65601;
    }

    private function api(PostTarget $target): PendingRequest
    {
        return $this->http(120)->withToken($target->account->access_token)->withHeaders([
            'Linkedin-Version' => config('social.linkedin_version'),
            'X-Restli-Protocol-Version' => '2.0.0',
        ]);
    }

    public function publish(PostTarget $target): string
    {
        $post = $target->post;
        $owner = 'urn:li:person:'.$target->account->external_id;

        $payload = [
            'author' => $owner,
            'commentary' => $this->escape((string) $post->body),
            'visibility' => 'PUBLIC',
            'distribution' => [
                'feedDistribution' => 'MAIN_FEED',
                'targetEntities' => [],
                'thirdPartyDistributionChannels' => [],
            ],
            'lifecycleState' => 'PUBLISHED',
            'isReshareDisabledByAuthor' => false,
        ];

        if ($post->media_type === 'image') {
            $payload['content'] = ['media' => ['id' => $this->uploadImage($target, $owner)]];
        } elseif ($post->media_type === 'video') {
            $payload['content'] = ['media' => ['id' => $this->uploadVideo($target, $owner)]];
        }

        $response = $this->send(fn () => $this->api($target)->post(self::API.'/posts', $payload), 'LinkedIn create post');

        $id = $response->header('x-restli-id');
        if (! $id) {
            throw PublishException::permanent('LinkedIn create post: response had no x-restli-id header.');
        }

        return $id;
    }

    private function uploadImage(PostTarget $target, string $owner): string
    {
        $init = $this->send(fn () => $this->api($target)->post(self::API.'/images?action=initializeUpload', [
            'initializeUploadRequest' => ['owner' => $owner],
        ]), 'LinkedIn image init');

        $uploadUrl = $init->json('value.uploadUrl');
        $imageUrn = $init->json('value.image');

        $this->send(fn () => $this->http(300)->withToken($target->account->access_token)
            ->withBody(file_get_contents($target->post->mediaFullPath()), 'application/octet-stream')
            ->put($uploadUrl), 'LinkedIn image upload');

        return $imageUrn;
    }

    private function uploadVideo(PostTarget $target, string $owner): string
    {
        $path = $target->post->mediaFullPath();
        $size = filesize($path);

        $init = $this->send(fn () => $this->api($target)->post(self::API.'/videos?action=initializeUpload', [
            'initializeUploadRequest' => [
                'owner' => $owner,
                'fileSizeBytes' => $size,
                'uploadCaptions' => false,
                'uploadThumbnail' => false,
            ],
        ]), 'LinkedIn video init');

        $videoUrn = $init->json('value.video');
        $token = $init->json('value.uploadToken', '');
        $parts = [];

        $handle = fopen($path, 'rb');
        try {
            foreach ($init->json('value.uploadInstructions', []) as $instruction) {
                $length = $instruction['lastByte'] - $instruction['firstByte'] + 1;
                fseek($handle, $instruction['firstByte']);
                $chunk = fread($handle, $length);

                $res = $this->send(fn () => $this->http(300)
                    ->withBody($chunk, 'application/octet-stream')
                    ->put($instruction['uploadUrl']), 'LinkedIn video part upload');
                $parts[] = trim($res->header('ETag'), '"');
            }
        } finally {
            fclose($handle);
        }

        $this->send(fn () => $this->api($target)->post(self::API.'/videos?action=finalizeUpload', [
            'finalizeUploadRequest' => [
                'video' => $videoUrn,
                'uploadToken' => $token,
                'uploadedPartIds' => $parts,
            ],
        ]), 'LinkedIn video finalize');

        return $videoUrn;
    }

    /** Escape LinkedIn "little text" reserved characters (hashtags are left as plain text). */
    private function escape(string $text): string
    {
        return preg_replace('/([\\\\|{}@\[\]()<>*_~])/', '\\\\$1', $text);
    }
}
