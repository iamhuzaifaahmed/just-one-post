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
        'telegram' => 'Telegram',
        'discord' => 'Discord',
        'threads' => 'Threads',
        'x' => 'X (Twitter)',
        'wordpress' => 'WordPress',
    ],

    // API hosts. Meta has been moving Threads between threads.net and threads.com: change here if needed.
    'threads_api_base' => env('THREADS_API_BASE', 'https://graph.threads.net'),
    'threads_auth_url' => env('THREADS_AUTH_URL', 'https://threads.com/oauth/authorize'),
    'x_api_base' => env('X_API_BASE', 'https://api.x.com'),
    'telegram_api_base' => env('TELEGRAM_API_BASE', 'https://api.telegram.org'),

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
        // Telegram Bot API (hosted server): text 4096, media caption 1024, photo 10 MB, video 50 MB.
        'telegram' => [
            'text' => 4096,
            'caption' => 1024,
            'image_mb' => 10,
            'video_mb' => 50,
        ],
        // Discord webhook: content 2000 chars. File limit depends on the server's boost level; 10 MB is the safe default.
        'discord' => [
            'text' => 2000,
            'file_mb' => 10,
        ],
        // Threads: 500 chars, JPEG/PNG up to 8 MB, MP4/MOV up to 1 GB and 5 minutes, max 5 links.
        'threads' => [
            'text' => 500,
            'links' => 5,
            'image_mb' => 8,
            'video_mb' => 1024,
            'video_seconds' => [1, 300],
        ],
        // X: 280 weighted chars (a URL counts as 23). Images 5 MB, video limits depend on the account.
        'x' => [
            'text' => 280,
            'url_length' => 23,
            'image_mb' => 5,
            'video_mb' => 512,
            'video_seconds' => [1, 140],
        ],
        'wordpress' => [
            'title' => 200,
            'media_mb' => 64,
        ],
    ],
];
