<?php

/**
 * Helpers for the web installer. Plain PHP with no framework, so it works before the app is configured
 * (no .env, no database). Loaded by resources/installer/install.php and by the unit tests.
 */

const INSTALLER_MIN_PHP = '8.2.0';

/** True once the app is configured: the lock file exists, or a finished .env with an APP_KEY is present. */
function installer_is_installed(string $root): bool
{
    if (is_file($root.'/storage/app/installed.lock')) {
        return true;
    }

    $env = $root.'/.env';
    if (! is_file($env)) {
        return false;
    }

    $content = (string) @file_get_contents($env);
    $hasKey = (bool) preg_match('/^APP_KEY=["\']?base64:[^"\'\s]{20,}/m', $content);
    $installing = (bool) preg_match('/^APP_INSTALLING=true\s*$/m', $content);

    // A half-finished install keeps APP_INSTALLING=true so the wizard can simply be run again.
    return $hasKey && ! $installing;
}

/** @return list<array{label:string, ok:bool, hint:string}> */
function installer_requirements(string $root): array
{
    $checks = [];
    $add = function (string $label, bool $ok, string $hint = '') use (&$checks) {
        $checks[] = ['label' => $label, 'ok' => $ok, 'hint' => $hint];
    };

    $add('PHP '.INSTALLER_MIN_PHP.' or newer (this server: '.PHP_VERSION.')', version_compare(PHP_VERSION, INSTALLER_MIN_PHP, '>='), 'In cPanel open "MultiPHP Manager" and choose PHP 8.2 or newer for this domain.');

    foreach (['pdo_mysql', 'mbstring', 'openssl', 'tokenizer', 'xml', 'ctype', 'json', 'fileinfo', 'curl', 'dom'] as $ext) {
        $add("PHP extension: $ext", extension_loaded($ext), 'In cPanel open "Select PHP Version" > Extensions and tick it.');
    }

    $add('Folder is writable: storage/', is_writable($root.'/storage'), 'Set permissions of "storage" (and its sub-folders) to 755 or 775.');
    $add('Folder is writable: bootstrap/cache/', is_writable($root.'/bootstrap/cache'), 'Set permissions of "bootstrap/cache" to 755 or 775.');
    $add('Project folder is writable (to create the .env file)', is_writable($root), 'Make the project folder writable for the installation, or create the .env file by hand.');
    $add('Application files are complete (vendor/ folder)', is_file($root.'/vendor/autoload.php'), 'Upload the full release zip: it contains the vendor folder.');

    return $checks;
}

function installer_requirements_ok(string $root): bool
{
    foreach (installer_requirements($root) as $check) {
        if (! $check['ok']) {
            return false;
        }
    }

    return true;
}

/** Parses mysql://user:pass@host:3306/dbname into the separate fields (null when it is not a valid URL). */
function installer_parse_db_url(string $url): ?array
{
    $url = trim($url);
    if ($url === '') {
        return null;
    }

    $p = parse_url($url);
    if (! $p || empty($p['host']) || empty($p['path']) || ! in_array($p['scheme'] ?? '', ['mysql', 'mariadb'], true)) {
        return null;
    }

    return [
        'host' => $p['host'],
        'port' => (string) ($p['port'] ?? 3306),
        'name' => ltrim(rawurldecode($p['path']), '/'),
        'user' => rawurldecode($p['user'] ?? ''),
        'pass' => rawurldecode($p['pass'] ?? ''),
    ];
}

/**
 * Quote a value for a .env file. Double quotes with \ " $ escaped: this round-trips any password
 * (spaces, quotes, #, $, ${VAR}, backslashes) through the dotenv parser that Laravel uses.
 */
function installer_env_quote(string $value): string
{
    if (preg_match('/^[A-Za-z0-9_.\/:@+,=-]*$/', $value) && $value !== '') {
        return $value;
    }

    return '"'.str_replace(['\\', '"', '$'], ['\\\\', '\\"', '\\$'], $value).'"';
}

/** Sets KEY=value lines in .env content: replaces existing (or commented) lines, appends missing ones. */
function installer_set_env(string $content, array $values): string
{
    foreach ($values as $key => $value) {
        $line = $key.'='.($value === null ? '' : installer_env_quote((string) $value));
        $pattern = '/^#?\s*'.preg_quote($key, '/').'=.*$/m';

        if (preg_match($pattern, $content)) {
            // preg_replace_callback so "$" or "\" in the value are not treated as references
            $content = preg_replace_callback($pattern, fn () => $line, $content, 1);
        } else {
            $content = rtrim($content, "\r\n")."\n".$line."\n";
        }
    }

    return $content;
}

/** Removes a KEY=... line completely. */
function installer_remove_env(string $content, string $key): string
{
    return preg_replace('/^'.preg_quote($key, '/').'=.*\R?/m', '', $content);
}

function installer_generate_key(): string
{
    return 'base64:'.base64_encode(random_bytes(32));
}

/** Best guess of the site address, without index.php / install / the public folder. */
function installer_detect_url(?array $server = null): string
{
    $server ??= $_SERVER;
    $https = (! empty($server['HTTPS']) && $server['HTTPS'] !== 'off')
        || (($server['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || (($server['SERVER_PORT'] ?? '') === '443');
    $host = $server['HTTP_HOST'] ?? ($server['SERVER_NAME'] ?? 'localhost');

    $dir = str_replace('\\', '/', dirname($server['SCRIPT_NAME'] ?? '/index.php'));
    $dir = preg_replace('#/public$#', '', $dir);
    $dir = ($dir === '/' || $dir === '.') ? '' : rtrim($dir, '/');

    return ($https ? 'https' : 'http').'://'.$host.$dir;
}

/**
 * Connects with the given credentials.
 *
 * @return array{ok:bool, message:string}
 */
function installer_check_database(array $db): array
{
    if (! extension_loaded('pdo_mysql')) {
        return ['ok' => false, 'message' => 'The PHP extension pdo_mysql is not enabled.'];
    }

    try {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], (int) $db['port'], $db['name']);
        $pdo = new PDO($dsn, $db['user'], $db['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 8]);

        $exists = $pdo->query("SHOW TABLES LIKE 'users'")->fetchColumn();
        if ($exists) {
            return ['ok' => false, 'message' => 'This database already contains an app installation (a "users" table exists). Use an empty database, so nothing gets overwritten.'];
        }

        return ['ok' => true, 'message' => 'Connected.'];
    } catch (PDOException $e) {
        $code = (int) ($e->errorInfo[1] ?? 0);

        return ['ok' => false, 'message' => match (true) {
            $code === 1045 => 'The database user name or password is wrong.',
            $code === 1049 => 'That database does not exist. Create it first in cPanel > MySQL Databases.',
            $code === 1044 => 'This database user has no access to that database. In cPanel > MySQL Databases add the user to the database with ALL PRIVILEGES.',
            in_array($code, [2002, 2003, 2005], true) => 'Could not reach the database server. On cPanel the host is almost always "localhost".',
            default => 'Database error: '.preg_replace('/\s+/', ' ', $e->getMessage()),
        }];
    }
}

/** The cron line the admin has to add in cPanel, with a best-guess PHP path. */
function installer_cron_line(string $root): string
{
    $candidates = [PHP_BINDIR.'/php', '/usr/local/bin/php', '/usr/bin/php'];
    $php = '/usr/local/bin/php';
    foreach ($candidates as $c) {
        if (@is_file($c) && @is_executable($c)) {
            $php = $c;
            break;
        }
    }

    $artisan = rtrim(str_replace('\\', '/', $root), '/').'/artisan';
    $q = fn (string $p) => str_contains($p, ' ') ? '"'.$p.'"' : $p;

    return '* * * * * '.$q($php).' '.$q($artisan).' schedule:run >> /dev/null 2>&1';
}
