# Just One Post

A self-hosted, multi-user (SaaS-style) social media scheduler: people register, connect their own accounts and schedule posts, and the person who installs it gets an admin panel. Write one post (text + optional image/video), pick the accounts to publish to, pick a date/time, and the app publishes automatically to **LinkedIn (personal profile), Facebook Pages, Instagram (Business/Creator), YouTube, Threads, X (Twitter), Telegram, Discord and WordPress**. Connect as many accounts of each as you like.

* Laravel 12 · PHP 8.2+ · React + Inertia (Breeze) · Vite · MySQL
* Designed for **shared cPanel hosting**: no queue daemon, no supervisor. One cron line drives everything.
* All times are stored in **UTC**; the UI displays/accepts **Asia/Dhaka** (change `DISPLAY_TIMEZONE`).

---

## How it works

```
cron (every minute) ─► php artisan schedule:run
                          ├─ posts:dispatch-due   queues one job per (post, account) that is due
                          ├─ queue:work --stop-when-empty --max-time=50   drains the `database` queue, then exits
                          └─ accounts:refresh-tokens (daily 03:00)   refreshes/flags expiring tokens
```

* Each (post, platform) is its own `PublishTargetJob`, so one platform failing never blocks another.
* **Retries:** 3 attempts with backoff (1 min, 5 min, 15 min). Permanent errors (validation, 4xx) fail immediately; network errors/429/5xx are retried. Retry manually from the Posts page.
* **Idempotent:** a job re-run never double-posts. The row is locked and checked (`published`/`cancelled`/`external_post_id`) before any API call, the external ID is saved atomically with the `published` status, and Instagram's container ID is stored so a retry resumes instead of creating a second container.
* **Tokens:** stored encrypted (`encrypted` cast), hidden from serialization, never logged. Google tokens are refreshed automatically; LinkedIn is refreshed only if the API returns a refresh token (normally it does not for self-serve apps); Facebook/Instagram Page tokens obtained from a long-lived user token do not expire. If a token cannot be refreshed or the API rejects it, the account is flagged **needs reconnect** and shown on the dashboard and Connections page.
* **Validation before dispatch** (`App\Services\PostValidator`, limits in `config/social.php`): caption length, Instagram needs media/JPEG/aspect ratio/hashtag count, YouTube needs a video + title, file sizes, and (if `FFPROBE_PATH` is set) video duration and aspect ratio.

### Platform notes (verified against current docs, Oct 2026)

| Platform | API used | Notes |
|---|---|---|
| LinkedIn | Versioned `POST https://api.linkedin.com/rest/posts` with `Linkedin-Version: 202609` + `X-Restli-Protocol-Version: 2.0.0`; Images API / Videos API for media | Personal profile, `w_member_social`. Version is configurable (`LINKEDIN_API_VERSION`); LinkedIn sunsets old versions roughly yearly, so bump it when needed. |
| Facebook | Graph API `v25.0` (`META_GRAPH_VERSION`): `/{page}/feed`, `/photos`, `/videos` (graph-video host) | Posts as the Page using the Page access token. |
| Instagram | Graph `v25.0`: `/{ig-id}/media` → poll `status_code` → `/{ig-id}/media_publish` | Image must be **JPEG**; video is published as a **Reel**. Media URL must be public (see below). Limit: 100 API posts / 24h. |
| YouTube | Data API v3 resumable upload (`videos.insert`) | ~1,600 quota units per upload (default 10,000/day ≈ 6 uploads/day). Optional "native schedule": upload now as private + `status.publishAt`. |
| Threads | Threads API `graph.threads.net/v1.0`: container → `threads_publish` (OAuth, scopes `threads_basic`, `threads_content_publish`) | Own Threads App ID/Secret (Meta app → Threads use case), you must be a Threads tester while the app is in Development mode. Media needs a public URL. 500 chars, 60-day token auto-refreshed. |
| X (Twitter) | API v2 `POST /2/tweets` + chunked `/2/media/upload` (OAuth 2.0, scopes `tweet.read tweet.write users.read offline.access media.write`) | **Pay-per-use**: X bills each created post (reported ≈ $0.015, ≈ $0.20 with a link; verify in your console). 280 weighted chars. Refresh tokens rotate. |
| Telegram | Bot API `sendMessage` / `sendPhoto` / `sendVideo` | Bot token + channel/group; the bot must be channel admin. Caption ≤ 1024, text ≤ 4096, video ≤ 50 MB. No developer app. |
| Discord | Webhook `POST /webhooks/{id}/{token}?wait=true` | Webhook URL per channel (stored encrypted). `@everyone`/role pings are disabled. Text ≤ 2000, files ≤ 10 MB by default. |
| WordPress | REST API `/wp-json/wp/v2/posts` + `/media` | Self-hosted WordPress ≥ 5.6 over HTTPS with an Application Password. Image = featured image, video embedded. |

---

## Local setup (XAMPP, Windows)

Requirements: XAMPP with PHP 8.2+ (enable `gd`, `fileinfo`, `curl`, `pdo_mysql`, `openssl`, `mbstring`), Composer, Node 20+.

```bash
cd C:\xampp\htdocs\just-one-post
composer install
npm install
copy .env.example .env
php artisan key:generate
```

1. Start **Apache** and **MySQL** in the XAMPP control panel.
2. Create the database (phpMyAdmin or CLI) – `.env.example` expects `just_one_post`, user `root`, empty password:
   ```bash
   C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE just_one_post CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```
3. Migrate and link storage:
   ```bash
   php artisan migrate
   php artisan storage:link
   ```
4. Run the app (two terminals):
   ```bash
   php artisan serve            # http://localhost:8000   (APP_URL in .env)
   npm run dev                  # or `npm run build` once
   ```
5. **Run the scheduler locally** – this replaces the cron entry (third terminal, leave it running):
   ```bash
   php artisan schedule:work
   ```
6. Open http://localhost:8000. Registration is open: **the first account you create becomes the admin**. (Or run `php artisan db:seed` to create the default admin `admin@example.com` / `admin123`, re-running resets that password.) **Change that password on the Profile page before deploying to a public site.**
   The in-app **Setup guide** (sidebar, বাংলা + English) walks through creating each developer app step by step.
7. Put your developer-app credentials in `.env` (below), then go to **Connections**.

> The redirect URIs below assume `php artisan serve` on `http://localhost:8000`. If you use Apache (`http://localhost/just-one-post/public`), change `APP_URL` and register those redirect URIs instead.

Run the tests: `php artisan test` (uses in-memory SQLite and `Http::fake()`, no real API calls).

### Testing Instagram locally (public media URL)

Instagram's servers download the media from a **public URL**, so it cannot work from `localhost`. The app refuses (with a clear message) if the media URL is local.

```bash
ngrok http 8000          # or: cloudflared tunnel --url http://localhost:8000
```

Then in `.env`:

```
PUBLIC_BASE_URL=https://your-tunnel-subdomain.ngrok-free.app
```

Media is served from `PUBLIC_BASE_URL/storage/...`, so `php artisan storage:link` must have been run. On cPanel just leave `PUBLIC_BASE_URL` empty (it falls back to `APP_URL`). Use the tunnel URL only for Instagram testing; log in via `localhost` as usual.

---

> **Easier:** the in-app **Setup guide** (sidebar, বাংলা + English) walks through every platform below *and* Threads, X, Telegram, Discord and WordPress click by click. Telegram, Discord and WordPress need no developer app at all: connect them from the Connections page. Threads and X redirect URIs are `BASE/connections/threads/callback` and `BASE/connections/x/callback`.

## Creating the developer apps

Put every secret in `.env` (never commit it). Placeholders are in `.env.example`. After editing `.env` run `php artisan config:clear` if you ever ran `config:cache`.

Replace `BASE` below with `http://localhost:8000` locally and `https://your-domain.com` in production. You can register **both** redirect URIs on each app.

### 1. LinkedIn  (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`)

1. https://www.linkedin.com/developers/apps → **Create app**. LinkedIn requires associating a LinkedIn **Company Page** (create a throwaway page if you have none) and uploading a logo.
2. **Products** tab → request **Share on LinkedIn** (grants `w_member_social`) and **Sign In with LinkedIn using OpenID Connect** (grants `openid profile email`). Both are self-serve and usually instant.
3. **Auth** tab → copy Client ID / Client Secret → `.env`. Under **Authorized redirect URLs for your app** add exactly:
   * `BASE/connections/linkedin/callback`
4. Scopes requested by the app: `openid profile email w_member_social`.
5. Tokens last ~60 days. The dashboard warns when one is about to expire; reconnect from **Connections** (LinkedIn does not offer refresh tokens to self-serve apps).

### 2. Meta – Facebook Page + Instagram  (`FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI`)

One Meta app covers both Facebook Pages and Instagram.

1. https://developers.facebook.com/apps → **Create app** → use case **Other** → type **Business**.
2. Add the **Facebook Login** product (Web). Under **Facebook Login → Settings → Valid OAuth Redirect URIs** add exactly:
   * `BASE/connections/facebook/callback`
3. **App settings → Basic**: copy App ID / App Secret → `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`.
4. Permissions requested by the app: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`.
   * While the app is in **Development mode** these work for you (as app admin/developer) **without App Review**. That is all a tool needs when each person uses their own developer app (see "Running it as a SaaS") – do not submit for review.
   * If your Page role comes via Business Manager, Meta may additionally require `ads_management`/`ads_read` for Instagram publishing; add them to the scopes in `ConnectionController::redirect()` if you hit a permissions error.
5. **Instagram:** the account must be a **Business or Creator** account **linked to a Facebook Page** you manage (Instagram → Settings → Account type, then link the Page). On connecting, the app creates one entry per Page and one per linked Instagram account.
6. In the consent dialog, tick the Pages (and Instagram accounts) you want to grant. Re-connect to add more later.

### 3. Google Cloud – YouTube  (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`)

1. https://console.cloud.google.com → create a project → **APIs & Services → Library** → enable **YouTube Data API v3**.
2. **OAuth consent screen**: user type External; add the scopes `https://www.googleapis.com/auth/youtube.upload` and `https://www.googleapis.com/auth/youtube.readonly`; add your Google account as a **test user**.
   **Important:** while the consent screen is in *Testing* status, Google refresh tokens expire after **7 days**. Click **Publish app** (to *In production*) – for personal use you can stay unverified and just click through the "unverified app" warning – so the refresh token lasts.
3. **Credentials → Create credentials → OAuth client ID → Web application**. **Authorized redirect URIs**:
   * `BASE/connections/youtube/callback`
4. Copy the client ID/secret → `.env`.
5. **Limits you should know:**
   * Default quota is 10,000 units/day and an upload costs ~1,600 → about 6 uploads/day. Request more via the quota form if needed.
   * Videos uploaded through an **unverified** API project (created after July 2020) may be forced to **private** until the project passes Google's API audit. The app detects this and shows a warning on the target when YouTube returns a different privacy than requested.
6. The Google account must have a YouTube channel.

---

## Deploying to cPanel

1. **Upload the project** (zip/git/File Manager) to e.g. `/home/USER/just-one-post` – *outside* `public_html`. If you can't build assets on the server, run `npm run build` locally and upload the `public/build` folder too. Run `composer install --no-dev --optimize-autoloader` locally (or via cPanel Terminal/SSH) so `vendor/` is present.
2. **Document root → `/public`.** In cPanel → *Domains* (or *Subdomains*) set the domain's document root to `/home/USER/just-one-post/public`. (If you must use `public_html`, copy the *contents* of `public/` there and edit `index.php` so the two `__DIR__.'/../...'` paths point at the project folder.)
3. **PHP:** select PHP 8.2+ (MultiPHP Manager) with extensions `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `curl`, `gd`. Raise `upload_max_filesize` and `post_max_size` (MultiPHP INI Editor) if you upload videos, e.g. 512M, and `max_execution_time`/`memory_limit` generously; also adjust `UPLOAD_MAX_KB` in `.env`.
4. **Database:** *MySQL Databases* → create a DB + user, grant all privileges.
5. **`.env`:** copy `.env.example` to `.env` and set:
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://your-domain.com
   DB_DATABASE=cpaneluser_dbname
   DB_USERNAME=cpaneluser_dbuser
   DB_PASSWORD=...
   QUEUE_CONNECTION=database
   SESSION_DRIVER=database
   LINKEDIN_REDIRECT_URI="${APP_URL}/connections/linkedin/callback"   # (already the default)
   ```
   plus all client IDs/secrets. Generate the key once: `php artisan key:generate --force`. **Back up `APP_KEY`** – tokens are encrypted with it and become unreadable if it changes.
6. **Commands (cPanel Terminal or SSH):**
   ```bash
   cd /home/USER/just-one-post
   php artisan migrate --force
   php artisan storage:link
   php artisan config:cache && php artisan route:cache
   ```
   If `storage:link` isn't possible (symlinks disabled), create the symlink with *cron* or ask the host, or copy/point the document root so `/storage` resolves to `storage/app/public`.
   Make sure `storage/` and `bootstrap/cache/` are writable (755/775).
7. **Cron (cPanel → Cron Jobs)** – one entry, every minute (use the PHP CLI path your host shows, often `/usr/local/bin/php` or `/opt/cpanel/ea-php82/root/usr/bin/php`):
   ```
   * * * * * /usr/local/bin/php /home/USER/just-one-post/artisan schedule:run >> /dev/null 2>&1
   ```
8. Visit `https://your-domain.com/register`, create your account (registration closes itself afterwards), then **Connections**. Register the production redirect URIs in each developer app.
9. After deploys: `php artisan migrate --force && php artisan config:cache && php artisan route:cache`, and re-run `npm run build` locally when the UI changes.

**Cron/queue behaviour on shared hosting:** `queue:work --stop-when-empty --max-time=50` starts each minute in the background, processes everything pending and exits. Several short-lived workers can overlap safely (the database queue reserves jobs atomically). `QUEUE_RETRY_AFTER` (default 1800 s) must exceed your longest upload so a slow video upload isn't picked up twice; even if it were, the idempotency checks prevent a double post. If your host kills long-running processes, large video uploads may fail – they'll be retried and eventually marked failed with the error shown.

---

## Running it as a SaaS

**Roles**

* **Users** register themselves (`/register`, rate limited) and get a completely separate workspace: their own connected accounts, posts, uploads and settings. Every query is scoped to the signed-in user (`App\Models\Concerns\BelongsToUser`), so another user's records simply return 404.
* **Admins** (the first account that registers, or anyone an admin promotes) additionally see an **Admin** section in the sidebar:
  * **Overview**: user counts, connected accounts per platform, posts by status, 24-hour success/failure counts, publishing-queue size, **scheduler heartbeat** (warns when the cron job stopped) and the latest failures across all users.
  * **Users**: search, suspend/unsuspend (signs the user out on their next request), promote/demote, **Log in as** (impersonation with a visible banner and an audit log line; not available for other admins or suspended users, and password change / account deletion are blocked while impersonating) and delete (removes the user's accounts, posts and uploaded files).
  * **App settings**: open/close registration, public base URL, API versions, ffprobe path.
* There is always at least one admin: the last admin cannot be demoted, suspended or deleted.

**Bring your own keys.** Each user stores their *own* developer-app credentials (Settings page, encrypted) and registers the same redirect URIs in their own LinkedIn/Meta/Google/X/Threads apps; the in-app Setup guide (বাংলা + English) walks them through it. Regular users never fall back to the server's `.env` credentials; the admin (owner of the install) still does. Because every user uses their own app in Development mode, **no platform app review is needed**. Telegram, Discord and WordPress need no developer app at all.

**Workers.** The cron/queue setup is unchanged: one `schedule:run` per minute dispatches due posts for *all* users, and the queue worker applies the owner's credentials per job (config is restored between jobs, so keys never leak between users).

**Before you open it to the public**

* Set up mail (`MAIL_*`) so password-reset e-mails work (the default mailer only logs), and consider requiring e-mail verification.
* Add your own Terms of Service / Privacy Policy pages, since users hand you OAuth tokens (stored encrypted with `APP_KEY`: back it up).
* Watch disk usage (uploads live in `storage/app/public/media`) and your host's PHP upload limits.
* There are no plans, quotas or billing; add them (or close registration) if abuse is a concern.

## Using the app

* **Connections** – connect/disconnect accounts; shows connection state and token expiry (`needs reconnect`, `expiring`).
* **New post** – caption, image/video, tick accounts, set date/time in Asia/Dhaka, **Schedule** or **Publish now**. YouTube accounts get title/description/privacy and the "native schedule" option.
* **Posts** – Upcoming / Published / Failed / All tabs; per-account status badges and error messages; **Retry** a failed account; **Cancel**; **Edit** while nothing has been published yet.

Commands: `php artisan posts:dispatch-due` (queue due posts now), `php artisan accounts:refresh-tokens`, `php artisan schedule:list`.

---

## Known limitations

* **X is not free**: its API is pay-per-use, so every post costs money and credits must be bought in the X developer console.
* **Threads and Instagram** need a publicly reachable media URL (see "Testing Instagram locally"); text-only Threads posts do not.
* **Telegram** posts as the channel/bot, not as you; **Discord** posts as the webhook; **WordPress** needs HTTPS for Application Passwords and a REST API that no plugin blocks.
* One media item per post on every platform.
* No billing, plans or per-user quotas, and no e-mail verification yet; see "Before you open it to the public".
* Every user needs their own developer apps (bring your own keys); there is no shared-app mode.

* **Single media item per post** (one image *or* one video). No carousels/multi-image.
* **Personal LinkedIn profile only** (no Company Pages – that needs `w_organization_social`). LinkedIn commentary is escaped for its "little text" format, so @mentions are not supported; hashtags are posted as plain text.
* **Instagram:** needs a publicly reachable media URL, JPEG images only, videos always become Reels, no Stories. Meta may require "Page Publishing Authorization" for some Pages.
* **YouTube:** quota (~6 uploads/day by default); unverified API projects may be forced to private; "native schedule" uploads immediately and YouTube publishes later (the target shows *published* once the upload is done).
* Video duration/aspect-ratio checks need `ffprobe` (`FFPROBE_PATH`); without it only size/format checks run and the platform may reject the video at publish time.
* Video uploads are streamed/sent in one request (LinkedIn in 4 MB parts) and are bounded by your host's PHP limits and process-kill policy. Resumable YouTube uploads restart from scratch on retry.
* Scheduling precision is one minute (cron granularity); a busy queue can delay posts a little.
* LinkedIn tokens cannot be auto-refreshed; reconnect roughly every 60 days. Google refresh tokens expire after 7 days if the consent screen stays in *Testing*.
* Meta Graph API and LinkedIn API versions change often – bump `META_GRAPH_VERSION` / `LINKEDIN_API_VERSION` and re-check the official docs when something starts failing.
* Password reset e-mails need working mail settings (`MAIL_*`); the default mailer only logs.
* Deleting a connected account removes its pending targets (published history for that account is removed too).
