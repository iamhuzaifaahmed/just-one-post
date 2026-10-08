<?php

return [

    /*
    | Timezone used to display and enter dates in the UI. Storage is always UTC.
    */
    'display_timezone' => env('DISPLAY_TIMEZONE', 'Asia/Dhaka'),

    /*
    | Public base URL used to build media URLs that Instagram must fetch.
    | Falls back to APP_URL. Must be reachable from the internet.
    */
    'public_base_url' => env('PUBLIC_BASE_URL'),

    'graph_version' => env('META_GRAPH_VERSION', 'v25.0'),
    'linkedin_version' => env('LINKEDIN_API_VERSION', '202609'),

    'ffprobe_path' => env('FFPROBE_PATH'),

    // Max upload size in KB for the composer (also bounded by PHP upload_max_filesize/post_max_size).
    'upload_max_kb' => (int) env('UPLOAD_MAX_KB', 512000),

    'platforms' => [
        'linkedin' => 'LinkedIn',
        'facebook' => 'Facebook Page',
        'instagram' => 'Instagram',
        'youtube' => 'YouTube',
    ],

    /*
    | Max automatic attempts per (post, platform) and backoff seconds between them.
    */
    'max_attempts' => 3,
    'backoff' => [60, 300, 900],

    /*
    | Seconds to wait between Instagram container status polls, and max polls per attempt.
    | (Set poll_sleep to 0 in tests.)
    */
    'instagram_poll_sleep' => 10,
    'instagram_poll_max' => 30,

    /*
    | Per-platform validation limits. Sizes in MB, durations in seconds.
    | Adjust here if a platform changes its limits. Duration/aspect checks for video
    | only run when ffprobe is available (FFPROBE_PATH).
    */
    'limits' => [
        'linkedin' => [
            'text' => 3000,
            'image_mb' => 10,
            'video_mb' => 500,
            'video_seconds' => [3, 1800],
        ],
        'facebook' => [
            'text' => 63206,
            'image_mb' => 10,
            'video_mb' => 1024,
            'video_seconds' => [1, 14400],
        ],
        'instagram' => [
            'text' => 2200,
            'hashtags' => 30,
            'image_mb' => 8,
            'video_mb' => 300,
            'video_seconds' => [3, 900],
            // width / height
            'image_ratio' => [0.8, 1.91],
            'video_ratio' => [0.01, 10],
        ],
        'youtube' => [
            'title' => 100,
            'description_bytes' => 5000,
            'video_mb' => 2048,
        ],
    ],
];
