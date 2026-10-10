<?php

/**
 * Web installer. public/index.php loads this file while the app has not been configured yet, so a fresh
 * upload on cPanel only needs: open the address, fill in the database and the admin account, press Install.
 * It runs without the framework (no .env, no database yet) and locks itself when it is done.
 */

declare(strict_types=1);

// index.php may already have loaded it (to decide whether to show the installer): load only once.
require_once __DIR__.'/functions.php';

$root = realpath(__DIR__.'/../..');
@set_time_limit(300);
if (session_status() !== PHP_SESSION_ACTIVE) {
    @session_start(); // native session, only used for the CSRF token
}
$_SESSION['csrf'] ??= bin2hex(random_bytes(16));

function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

$requirements = installer_requirements($root);
$requirementsOk = installer_requirements_ok($root);
$envPath = $root.'/.env';
$previousEnv = is_file($envPath) ? (string) @file_get_contents($envPath) : '';
$retrying = (bool) preg_match('/^APP_INSTALLING=true\s*$/m', $previousEnv); // an earlier attempt stopped half-way

$values = [
    'app_name' => 'Techlo Post',
    'app_url' => installer_detect_url(),
    'timezone' => 'Asia/Dhaka',
    'db_url' => '',
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => '',
    'db_user' => '',
    'admin_name' => '',
    'admin_email' => '',
];
$errors = [];
$done = null;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    foreach (array_keys($values) as $k) {
        if (isset($_POST[$k])) {
            $values[$k] = trim((string) $_POST[$k]);
        }
    }
    $dbPass = (string) ($_POST['db_pass'] ?? '');
    $adminPass = (string) ($_POST['admin_password'] ?? '');
    $adminPass2 = (string) ($_POST['admin_password_confirmation'] ?? '');

    if (! hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
        $errors[] = 'This page expired. Please reload it and try again.';
    }
    if (! $requirementsOk) {
        $errors[] = 'Please fix the items marked in red in the server check first.';
    }

    // A pasted database URL (mysql://user:pass@host:3306/name) overrides the separate fields.
    if ($values['db_url'] !== '') {
        $parsed = installer_parse_db_url($values['db_url']);
        if ($parsed) {
            [$values['db_host'], $values['db_port'], $values['db_name'], $values['db_user']] = [$parsed['host'], $parsed['port'], $parsed['name'], $parsed['user']];
            $dbPass = $parsed['pass'];
        } else {
            $errors[] = 'The database URL is not valid. It should look like mysql://user:password@localhost:3306/database_name';
        }
    }

    if ($values['app_name'] === '' || mb_strlen($values['app_name']) > 60) {
        $errors[] = 'Enter a site name (up to 60 characters).';
    }
    if (! preg_match('#^https?://[^\s/]+#i', $values['app_url'])) {
        $errors[] = 'The site address must start with http:// or https://';
    }
    if (! in_array($values['timezone'], DateTimeZone::listIdentifiers(), true)) {
        $errors[] = 'Choose a valid time zone.';
    }
    foreach (['db_host' => 'database host', 'db_name' => 'database name', 'db_user' => 'database user'] as $k => $label) {
        if ($values[$k] === '') {
            $errors[] = "Enter the $label.";
        }
    }
    if (! ctype_digit($values['db_port'])) {
        $errors[] = 'The database port must be a number (usually 3306).';
    }
    if ($values['admin_name'] === '') {
        $errors[] = 'Enter the admin name.';
    }
    if (! filter_var($values['admin_email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Enter a valid admin e-mail address.';
    }
    if (strlen($adminPass) < 8) {
        $errors[] = 'The admin password must be at least 8 characters.';
    } elseif ($adminPass !== $adminPass2) {
        $errors[] = 'The two admin passwords do not match.';
    }

    $db = ['host' => $values['db_host'], 'port' => $values['db_port'], 'name' => $values['db_name'], 'user' => $values['db_user'], 'pass' => $dbPass];

    if (! $errors) {
        $check = installer_check_database($db);
        // After a half-finished attempt the tables from that attempt are expected: carry on instead of refusing.
        if (! $check['ok'] && ! ($retrying && str_contains($check['message'], 'already contains'))) {
            $errors[] = $check['message'];
        }
    }

    if (! $errors) {
        try {
            $existingKey = preg_match('/^APP_KEY=["\']?(base64:[^"\'\s]{20,})/m', $previousEnv, $m) ? $m[1] : null;
            $base = is_file($root.'/.env.example') ? (string) file_get_contents($root.'/.env.example') : '';
            $env = installer_set_env($base !== '' ? $base : $previousEnv, [
                'APP_NAME' => $values['app_name'],
                'APP_ENV' => 'production',
                'APP_DEBUG' => 'false',
                'APP_URL' => rtrim($values['app_url'], '/'),
                'APP_KEY' => $existingKey ?? installer_generate_key(),
                'DB_CONNECTION' => 'mysql',
                'DB_HOST' => $values['db_host'],
                'DB_PORT' => $values['db_port'],
                'DB_DATABASE' => $values['db_name'],
                'DB_USERNAME' => $values['db_user'],
                'DB_PASSWORD' => $dbPass,
                'DISPLAY_TIMEZONE' => $values['timezone'],
                'SESSION_DRIVER' => 'database',
                'QUEUE_CONNECTION' => 'database',
                'CACHE_STORE' => 'database',
                'APP_INSTALLING' => 'true',
            ]);
            if (@file_put_contents($envPath, $env, LOCK_EX) === false) {
                throw new RuntimeException('Could not write the .env file. Make the project folder writable and try again.');
            }

            // Boot the app now that it has a configuration, then set up the database and the admin account.
            require $root.'/vendor/autoload.php';
            $app = require $root.'/bootstrap/app.php';
            $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
            $kernel->bootstrap();

            $kernel->call('migrate', ['--force' => true]);

            $user = App\Models\User::where('email', $values['admin_email'])->first();
            if (! $user) {
                $user = App\Models\User::create(['name' => $values['admin_name'], 'email' => strtolower($values['admin_email']), 'password' => $adminPass]);
            }
            $user->forceFill(['is_admin' => true])->save();

            $linkNote = null;
            try {
                if (! is_link($root.'/public/storage') && ! is_dir($root.'/public/storage')) {
                    $kernel->call('storage:link');
                }
            } catch (Throwable $e) {
                $linkNote = 'The storage link could not be created (symlinks may be disabled). That is fine: uploaded images are served by the app itself.';
            }

            // Finish: drop the "installing" marker and lock the installer.
            file_put_contents($envPath, installer_remove_env((string) file_get_contents($envPath), 'APP_INSTALLING'), LOCK_EX);
            if (! is_dir($root.'/storage/app')) {
                @mkdir($root.'/storage/app', 0775, true);
            }
            file_put_contents($root.'/storage/app/installed.lock', 'Installed '.gmdate('c')."\n");

            $done = [
                'url' => rtrim($values['app_url'], '/'),
                'email' => strtolower($values['admin_email']),
                'cron' => installer_cron_line($root),
                'note' => $linkNote,
            ];
            $_SESSION = [];
        } catch (Throwable $e) {
            $message = preg_replace('/\s+/', ' ', $e->getMessage());
            // Never echo secrets back: hide the database password if the driver put it in the message.
            if ($dbPass !== '') {
                $message = str_replace($dbPass, '********', $message);
            }
            $errors[] = 'The installation stopped: '.$message.' You can fix the problem and press Install again.';
        }
    }
}

$timezones = DateTimeZone::listIdentifiers();
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Install · Techlo Post</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='64' height='64' rx='14' fill='%23010818'/%3E%3Crect x='9' y='15' width='34' height='9' rx='4.5' fill='%23fff'/%3E%3Crect x='21' y='15' width='10' height='34' rx='5' fill='%23fff'/%3E%3Crect x='47' y='24' width='9' height='25' rx='4.5' fill='%2318a9e5'/%3E%3Ccircle cx='51.5' cy='15.5' r='4.5' fill='%2318a9e5'/%3E%3C/svg%3E">
    <script>
        (function () {
            try {
                var saved = localStorage.getItem('theme');
                var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', dark);
            } catch (e) {}
        })();
    </script>
    <style>
        :root { --canvas:#fff; --soft:#f4f7fc; --panel:#fff; --fg:#0b1220; --muted:#5b667a; --line:#e1e7f0; --brand:#0163ea; --brand-fg:#fff; --ok:#047857; --bad:#b91c1c; --grid:rgba(11,18,32,.06); color-scheme:light; }
        .dark { --canvas:#05080f; --soft:#090e1a; --panel:#0d1424; --fg:#e8edf7; --muted:#8b97ad; --line:#1a2740; --brand:#3b8cff; --brand-fg:#04101f; --ok:#34d399; --bad:#f87171; --grid:rgba(139,151,173,.08); color-scheme:dark; }
        * { box-sizing: border-box; }
        body { margin:0; font-family: Inter, "Hind Siliguri", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; background:var(--canvas); color:var(--fg); line-height:1.5; -webkit-font-smoothing:antialiased;
               background-image: radial-gradient(55% 40% at 50% 0%, color-mix(in srgb, var(--brand) 22%, transparent), transparent 70%); background-repeat:no-repeat; }
        .wrap { max-width: 720px; margin: 0 auto; padding: 24px 18px 64px; }
        header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 22px; }
        .brand { display:flex; align-items:center; gap:10px; font-weight:700; font-size:18px; letter-spacing:-.01em; }
        .brand b { color: var(--brand); font-weight:700; }
        .brand svg { width:36px; height:36px; border-radius:10px; box-shadow:0 8px 20px -6px color-mix(in srgb, var(--brand) 40%, transparent); }
        .toggle { display:inline-flex; gap:2px; padding:2px; border:1px solid var(--line); border-radius:999px; background:var(--soft); }
        .toggle button { width:28px; height:28px; border-radius:999px; border:0; background:transparent; color:var(--muted); cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .toggle button[aria-pressed="true"] { background:var(--brand); color:var(--brand-fg); }
        .eyebrow { font-family: ui-monospace, "JetBrains Mono", Menlo, monospace; font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--brand); display:inline-flex; align-items:center; gap:8px; }
        .eyebrow::before { content:""; width:6px; height:6px; border-radius:50%; background:var(--brand); }
        h1 { font-size: 30px; line-height:1.15; letter-spacing:-.02em; margin:10px 0 6px; }
        p.lead { color:var(--muted); margin:0 0 22px; }
        .card { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:20px; margin-bottom:16px; box-shadow:0 1px 2px rgba(11,18,32,.04); }
        .card h2 { font-size:15px; margin:0 0 4px; }
        .card .sub { color:var(--muted); font-size:13px; margin:0 0 14px; }
        .grid2 { display:grid; grid-template-columns: 1fr 1fr; gap:14px; }
        @media (max-width: 560px) { .grid2 { grid-template-columns: 1fr; } h1 { font-size: 26px; } }
        label { display:block; font-size:13px; font-weight:600; margin-bottom:6px; }
        input, select { width:100%; font:inherit; font-size:14px; color:var(--fg); background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:10px 12px; outline:none; }
        input:focus, select:focus { border-color:var(--brand); box-shadow:0 0 0 3px color-mix(in srgb, var(--brand) 20%, transparent); }
        .hint { font-size:12px; color:var(--muted); margin-top:5px; }
        .field { margin-bottom:14px; }
        .btn { width:100%; font:inherit; font-weight:600; font-size:15px; border:0; border-radius:12px; padding:13px 16px; background:var(--brand); color:var(--brand-fg); cursor:pointer; box-shadow:0 8px 20px -8px color-mix(in srgb, var(--brand) 60%, transparent); }
        .btn:disabled { opacity:.5; cursor:not-allowed; }
        .btn.secondary { background:var(--soft); color:var(--fg); border:1px solid var(--line); box-shadow:none; }
        ul.checks { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
        ul.checks li { display:flex; gap:10px; align-items:flex-start; font-size:14px; }
        .dot { flex:none; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#fff; margin-top:1px; }
        .dot.ok { background:var(--ok); } .dot.bad { background:var(--bad); }
        li small { display:block; color:var(--muted); font-size:12px; }
        .alert { border:1px solid color-mix(in srgb, var(--bad) 40%, transparent); background:color-mix(in srgb, var(--bad) 10%, transparent); color:var(--fg); border-radius:14px; padding:14px 16px; margin-bottom:16px; font-size:14px; }
        .alert ul { margin:6px 0 0; padding-left:18px; }
        .okbox { border:1px solid color-mix(in srgb, var(--ok) 40%, transparent); background:color-mix(in srgb, var(--ok) 10%, transparent); border-radius:14px; padding:14px 16px; margin-bottom:16px; }
        code, .code { font-family: ui-monospace, "JetBrains Mono", Menlo, monospace; font-size:12.5px; }
        .copy { display:flex; gap:8px; align-items:stretch; background:var(--soft); border:1px solid var(--line); border-radius:12px; padding:8px 8px 8px 12px; }
        .copy code { flex:1; word-break:break-all; align-self:center; user-select:all; }
        .copy button { border:1px solid var(--line); background:var(--panel); color:var(--fg); border-radius:8px; padding:6px 12px; font:inherit; font-size:12px; font-weight:600; cursor:pointer; }
        details summary { cursor:pointer; font-size:13px; color:var(--brand); font-weight:600; margin-bottom:10px; }
        ol.steps { padding-left:18px; margin:8px 0 0; font-size:14px; } ol.steps li { margin-bottom:8px; }
    </style>
</head>
<body>
<div class="wrap">
    <header>
        <div class="brand">
            <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#010818"/><rect x="9" y="15" width="34" height="9" rx="4.5" fill="#fff"/><rect x="21" y="15" width="10" height="34" rx="5" fill="#fff"/><rect x="47" y="24" width="9" height="25" rx="4.5" fill="#18a9e5"/><circle cx="51.5" cy="15.5" r="4.5" fill="#18a9e5"/></svg>
            <span>Techlo <b>Post</b></span>
        </div>
        <div class="toggle" role="group" aria-label="Theme">
            <button type="button" id="tl" aria-label="Light mode"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>
            <button type="button" id="td" aria-label="Dark mode"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg></button>
        </div>
    </header>

<?php if ($done): ?>
    <span class="eyebrow">Installation complete</span>
    <h1>You are all set 🎉</h1>
    <p class="lead">The database is ready and your admin account was created.</p>

    <div class="okbox">
        <strong>Admin login:</strong> <?= h($done['email']) ?><br>
        <span style="color:var(--muted);font-size:13px">Use the password you just chose.</span>
    </div>

    <div class="card">
        <h2>One last step: the scheduler</h2>
        <p class="sub">Scheduled posts are published by a cron job that runs every minute. In cPanel open <b>Cron Jobs</b>, choose <b>Once Per Minute</b> and paste this command:</p>
        <div class="copy"><code id="cron"><?= h($done['cron']) ?></code><button type="button" onclick="copyText('cron', this)">Copy</button></div>
        <p class="hint">If your host shows a different PHP path in the cron page, use that path instead of the first part. After the first minute, the admin Overview page shows "Scheduler: last ran … ago".</p>
    </div>

    <div class="card">
        <h2>Good to know</h2>
        <ol class="steps">
            <li>Open <b>Admin &rarr; App settings</b> to close or open registration for other people.</li>
            <li>Set the mail settings (<code>MAIL_*</code>) in the <code>.env</code> file if you want password-reset e-mails to work.</li>
            <li>The file <code>.env</code> holds the secret key that encrypts all connected-account tokens. Keep a backup copy of it.</li>
            <?php if ($done['note']): ?><li><?= h($done['note']) ?></li><?php endif; ?>
        </ol>
    </div>

    <a class="btn" style="display:block;text-align:center;text-decoration:none" href="<?= h($done['url']) ?>/login">Open the login page</a>

<?php else: ?>
    <span class="eyebrow">Installation</span>
    <h1>Set up Techlo Post</h1>
    <p class="lead">Takes about a minute. You only need the database details from cPanel and the admin account you want to use.</p>

    <?php if ($retrying): ?>
        <div class="okbox" style="border-color:var(--line);background:var(--soft)">A previous installation attempt stopped half-way. Press Install again, it continues where it stopped.</div>
    <?php endif; ?>

    <?php if ($errors): ?>
        <div class="alert"><strong>Please check:</strong><ul><?php foreach ($errors as $e): ?><li><?= h($e) ?></li><?php endforeach; ?></ul></div>
    <?php endif; ?>

    <div class="card">
        <h2>1. Server check</h2>
        <p class="sub">Everything must be green before you can install.</p>
        <ul class="checks">
            <?php foreach ($requirements as $r): ?>
                <li><span class="dot <?= $r['ok'] ? 'ok' : 'bad' ?>"><?= $r['ok'] ? '✓' : '✕' ?></span><div><?= h($r['label']) ?><?php if (! $r['ok']): ?><small><?= h($r['hint']) ?></small><?php endif; ?></div></li>
            <?php endforeach; ?>
        </ul>
    </div>

    <form method="post" id="form" autocomplete="off">
        <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">

        <div class="card">
            <h2>2. Site</h2>
            <div class="grid2">
                <div class="field"><label for="app_name">Site name</label><input id="app_name" name="app_name" value="<?= h($values['app_name']) ?>" required maxlength="60"></div>
                <div class="field"><label for="timezone">Time zone</label>
                    <select id="timezone" name="timezone"><?php foreach ($timezones as $tz): ?><option value="<?= h($tz) ?>"<?= $tz === $values['timezone'] ? ' selected' : '' ?>><?= h($tz) ?></option><?php endforeach; ?></select>
                </div>
            </div>
            <div class="field"><label for="app_url">Site address</label><input id="app_url" name="app_url" value="<?= h($values['app_url']) ?>" required>
                <div class="hint">Detected automatically. It is used for login redirects and the links to your uploaded images.</div></div>
        </div>

        <div class="card">
            <h2>3. Database</h2>
            <p class="sub">Create an empty MySQL database in cPanel &rarr; <b>MySQL Databases</b> (database, user, and add the user to the database with all privileges), then enter it here.</p>
            <div class="grid2">
                <div class="field"><label for="db_host">Host</label><input id="db_host" name="db_host" value="<?= h($values['db_host']) ?>" required></div>
                <div class="field"><label for="db_port">Port</label><input id="db_port" name="db_port" value="<?= h($values['db_port']) ?>" required inputmode="numeric"></div>
                <div class="field"><label for="db_name">Database name</label><input id="db_name" name="db_name" value="<?= h($values['db_name']) ?>" required placeholder="cpaneluser_techlopost"></div>
                <div class="field"><label for="db_user">Database user</label><input id="db_user" name="db_user" value="<?= h($values['db_user']) ?>" required placeholder="cpaneluser_dbuser"></div>
            </div>
            <div class="field"><label for="db_pass">Database password</label><input id="db_pass" name="db_pass" type="password" autocomplete="new-password"></div>
            <details>
                <summary>Or paste a database URL</summary>
                <div class="field"><input id="db_url" name="db_url" value="<?= h($values['db_url']) ?>" placeholder="mysql://user:password@localhost:3306/database_name">
                    <div class="hint">If you fill this in, it replaces the fields above.</div></div>
            </details>
        </div>

        <div class="card">
            <h2>4. Your admin account</h2>
            <p class="sub">You sign in with this. As admin you manage users and see how the system is doing.</p>
            <div class="grid2">
                <div class="field"><label for="admin_name">Name</label><input id="admin_name" name="admin_name" value="<?= h($values['admin_name']) ?>" required></div>
                <div class="field"><label for="admin_email">E-mail</label><input id="admin_email" name="admin_email" type="email" value="<?= h($values['admin_email']) ?>" required></div>
                <div class="field"><label for="admin_password">Password (8+ characters)</label><input id="admin_password" name="admin_password" type="password" required minlength="8" autocomplete="new-password"></div>
                <div class="field"><label for="admin_password_confirmation">Repeat password</label><input id="admin_password_confirmation" name="admin_password_confirmation" type="password" required minlength="8" autocomplete="new-password"></div>
            </div>
        </div>

        <button class="btn" id="go" type="submit"<?= $requirementsOk ? '' : ' disabled' ?>>Install</button>
        <p class="hint" style="text-align:center;margin-top:10px">Installing creates the tables and your admin account. It can take up to a minute.</p>
    </form>
<?php endif; ?>
</div>

<script>
    (function () {
        var html = document.documentElement;
        function sync() { var d = html.classList.contains('dark'); document.getElementById('tl').setAttribute('aria-pressed', String(!d)); document.getElementById('td').setAttribute('aria-pressed', String(d)); }
        function set(d) { html.classList.toggle('dark', d); try { localStorage.setItem('theme', d ? 'dark' : 'light'); } catch (e) {} sync(); }
        document.getElementById('tl').onclick = function () { set(false); };
        document.getElementById('td').onclick = function () { set(true); };
        sync();

        var form = document.getElementById('form');
        if (form) form.addEventListener('submit', function () { var b = document.getElementById('go'); b.disabled = true; b.textContent = 'Installing… please wait'; });
    })();
    function copyText(id, btn) {
        var text = document.getElementById(id).innerText;
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).catch(function () {
            var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove();
        }).finally(function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1600); });
    }
</script>
</body>
</html>
