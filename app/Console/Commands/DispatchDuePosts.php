<?php

namespace App\Console\Commands;

use App\Services\PostDispatcher;
use Illuminate\Console\Command;

class DispatchDuePosts extends Command
{
    protected $signature = 'posts:dispatch-due';

    protected $description = 'Queue a publish job for every scheduled post target that is now due';

    public function handle(PostDispatcher $dispatcher): int
    {
        $count = $dispatcher->dispatchDue();
        $this->info("Dispatched $count target(s).");

        return self::SUCCESS;
    }
}
