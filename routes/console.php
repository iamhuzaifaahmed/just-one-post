<?php

use Illuminate\Support\Facades\Schedule;

/*
| cPanel cron (one entry, every minute):
|   * * * * * /usr/local/bin/php /home/USER/just-one-post/artisan schedule:run >> /dev/null 2>&1
|
| Scheduled tasks run sequentially, so due posts are queued first and then the
| worker drains the queue and exits (no daemon / supervisor needed).
*/
Schedule::command('posts:dispatch-due')->everyMinute()->withoutOverlapping(5);

Schedule::command('queue:work --stop-when-empty --max-time=50 --tries=6 --sleep=1')
    ->everyMinute()
    // Run in the background so a slow video upload never delays the next minute's dispatch.
    // Overlapping workers are safe: the database queue reserves each job atomically.
    ->runInBackground();

Schedule::command('accounts:refresh-tokens')->dailyAt('03:00');
