<?php

namespace App\Console\Commands;

use App\Services\PostDispatcher;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class DispatchDuePosts extends Command
{
    protected $signature = 'posts:dispatch-due';

    protected $description = 'Queue a publish job for every scheduled post target that is now due';

    public function handle(PostDispatcher $dispatcher): int
    {
        $count = $dispatcher->dispatchDue();

        // The admin dashboard shows when the cron/scheduler last ran, so a dead cron is noticed.
        Cache::put('scheduler.heartbeat', now()->toIso8601String(), 86400);

        $this->info("Dispatched $count target(s).");

        return self::SUCCESS;
    }
}
