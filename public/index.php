<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// First run: there is no configuration yet, so show the web installer instead of the app.
// (Upload the release zip, open the address, enter the database: no terminal needed.)
$installerRoot = dirname(__DIR__);
if (! is_file($installerRoot.'/storage/app/installed.lock')) {
    require_once $installerRoot.'/resources/installer/functions.php';
    if (! installer_is_installed($installerRoot)) {
        require $installerRoot.'/resources/installer/install.php';
        exit;
    }
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
