<?php

namespace App\Console\Commands;

use App\Services\TokenManager;
use Illuminate\Console\Command;

class RefreshTokens extends Command
{
    protected $signature = 'accounts:refresh-tokens';

    protected $description = 'Refresh expiring OAuth tokens and flag accounts that need reconnecting';

    public function handle(TokenManager $tokens): int
    {
        $this->info('Checked '.$tokens->refreshExpiring().' expiring account(s).');

        return self::SUCCESS;
    }
}
