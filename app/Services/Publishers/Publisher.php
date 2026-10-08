<?php

namespace App\Services\Publishers;

use App\Models\PostTarget;

interface Publisher
{
    /**
     * Publish the target's post to the platform and return the platform's post id.
     *
     * @throws PublishException
     */
    public function publish(PostTarget $target): string;
}
