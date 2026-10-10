<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\UpdateController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InstallerTest extends TestCase
{
    use RefreshDatabase;

    private string $tmp;

    protected function setUp(): void
    {
        parent::setUp();
        require_once base_path('resources/installer/functions.php');

        $this->tmp = sys_get_temp_dir().'/installer-test-'.bin2hex(random_bytes(4));
        mkdir($this->tmp.'/storage/app', 0777, true);
    }

    protected function tearDown(): void
    {
        @unlink($this->tmp.'/storage/app/installed.lock');
        @unlink($this->tmp.'/.env');
        @rmdir($this->tmp.'/storage/app');
        @rmdir($this->tmp.'/storage');
        @rmdir($this->tmp);
        parent::tearDown();
    }

    /* ------------------------------ is it installed? ------------------------------ */

    public function test_a_fresh_upload_with_no_env_is_not_installed(): void
    {
        $this->assertFalse(installer_is_installed($this->tmp));
    }

    public function test_a_finished_env_with_a_key_counts_as_installed(): void
    {
        file_put_contents($this->tmp.'/.env', "APP_NAME=x\nAPP_KEY=base64:".base64_encode(random_bytes(32))."\n");
        $this->assertTrue(installer_is_installed($this->tmp));
    }

    public function test_a_quoted_app_key_counts_too_and_is_kept_when_the_installer_is_run_again(): void
    {
        $key = 'base64:'.base64_encode(random_bytes(32));
        file_put_contents($this->tmp.'/.env', 'APP_KEY="'.$key."\"\n");
        $this->assertTrue(installer_is_installed($this->tmp));

        // the installer never quotes a generated key, so it stays readable by the checks above
        $this->assertStringContainsString('APP_KEY='.$key."\n", installer_set_env('', ['APP_KEY' => $key]));
    }

    public function test_an_env_without_a_key_is_not_installed(): void
    {
        file_put_contents($this->tmp.'/.env', "APP_NAME=x\nAPP_KEY=\n");
        $this->assertFalse(installer_is_installed($this->tmp));
    }

    public function test_a_half_finished_install_can_be_run_again(): void
    {
        file_put_contents($this->tmp.'/.env', "APP_KEY=base64:".base64_encode(random_bytes(32))."\nAPP_INSTALLING=true\n");
        $this->assertFalse(installer_is_installed($this->tmp));

        // ...until the installer finishes and writes its lock
        file_put_contents($this->tmp.'/storage/app/installed.lock', 'done');
        $this->assertTrue(installer_is_installed($this->tmp));
    }

    public function test_this_real_installation_is_never_offered_the_installer(): void
    {
        // Guards against the wizard appearing on an existing site (it would let a visitor reinstall).
        $this->assertTrue(installer_is_installed(base_path()));
    }

    /* ------------------------------ .env writing ------------------------------ */

    public function test_env_values_are_replaced_appended_and_safely_quoted(): void
    {
        $base = "APP_NAME=Old\n# DB_HOST=127.0.0.1\nDB_PORT=3306\n";
        $out = installer_set_env($base, [
            'APP_NAME' => 'Techlo Post',
            'DB_HOST' => 'localhost',
            'DB_PASSWORD' => 'p@ss $word \'q\' ${HOME} \\ #hash',
            'NEW_KEY' => 'x',
        ]);

        $this->assertStringContainsString('APP_NAME="Techlo Post"', $out);
        $this->assertStringContainsString("DB_HOST=localhost\n", $out);      // commented line was replaced, not duplicated
        $this->assertSame(1, substr_count($out, 'DB_HOST='));
        $this->assertStringContainsString("DB_PORT=3306", $out);
        $this->assertStringContainsString("NEW_KEY=x", $out);

        // The value round-trips through a real dotenv parser exactly as typed.
        $parsed = \Dotenv\Dotenv::parse($out);
        $this->assertSame('p@ss $word \'q\' ${HOME} \\ #hash', $parsed['DB_PASSWORD']);
        $this->assertSame('Techlo Post', $parsed['APP_NAME']);
        $this->assertSame('localhost', $parsed['DB_HOST']);
    }

    public function test_the_installing_marker_can_be_removed(): void
    {
        $out = installer_remove_env("A=1\nAPP_INSTALLING=true\nB=2\n", 'APP_INSTALLING');
        $this->assertSame("A=1\nB=2\n", $out);
    }

    public function test_generated_keys_are_valid_laravel_keys(): void
    {
        $key = installer_generate_key();
        $this->assertStringStartsWith('base64:', $key);
        $this->assertSame(32, strlen(base64_decode(substr($key, 7))));
        $this->assertNotSame($key, installer_generate_key());
    }

    /* ------------------------------ form helpers ------------------------------ */

    public function test_a_database_url_is_split_into_fields(): void
    {
        $this->assertSame(
            ['host' => 'db.example.com', 'port' => '3307', 'name' => 'techlo_post', 'user' => 'u@x', 'pass' => 'p:ss/w'],
            installer_parse_db_url('mysql://u%40x:p%3Ass%2Fw@db.example.com:3307/techlo_post'),
        );
        $this->assertSame('3306', installer_parse_db_url('mysql://u:p@localhost/db')['port']);
        $this->assertNull(installer_parse_db_url('postgres://u:p@localhost/db'));
        $this->assertNull(installer_parse_db_url('not a url'));
        $this->assertNull(installer_parse_db_url(''));
    }

    public function test_the_site_address_is_detected_without_index_php_or_public(): void
    {
        $this->assertSame('https://post.example.com', installer_detect_url(['HTTPS' => 'on', 'HTTP_HOST' => 'post.example.com', 'SCRIPT_NAME' => '/index.php']));
        $this->assertSame('http://example.com/app', installer_detect_url(['HTTP_HOST' => 'example.com', 'SCRIPT_NAME' => '/app/public/index.php']));
        $this->assertSame('https://example.com', installer_detect_url(['HTTP_X_FORWARDED_PROTO' => 'https', 'HTTP_HOST' => 'example.com', 'SCRIPT_NAME' => '/public/index.php']));
    }

    public function test_the_cron_line_points_at_artisan_schedule_run(): void
    {
        $line = installer_cron_line('C:\\sites\\techlo');
        $this->assertMatchesRegularExpression('#^\* \* \* \* \* \S+ C:/sites/techlo/artisan schedule:run >> /dev/null 2>&1$#', $line);
        $this->assertStringContainsString('"C:/my sites/techlo/artisan"', installer_cron_line('C:\\my sites\\techlo'));
    }

    public function test_requirements_report_missing_pieces(): void
    {
        $checks = installer_requirements($this->tmp); // an empty folder: no vendor/, not a project
        $failed = collect($checks)->reject(fn ($c) => $c['ok'])->pluck('label')->implode(' | ');

        $this->assertStringContainsString('vendor', $failed);
        $this->assertFalse(installer_requirements_ok($this->tmp));
        $this->assertTrue(collect($checks)->every(fn ($c) => isset($c['label'], $c['ok'], $c['hint'])));
    }

    public function test_database_errors_are_explained_in_plain_words(): void
    {
        // Nothing listens on port 1: a connection error, not a credentials error.
        $result = installer_check_database(['host' => '127.0.0.1', 'port' => '1', 'name' => 'x', 'user' => 'x', 'pass' => 'x']);

        $this->assertFalse($result['ok']);
        $this->assertStringContainsString('Could not reach the database server', $result['message']);
    }

    /* ------------------------------ media without the storage symlink ------------------------------ */

    public function test_uploaded_files_are_served_by_the_app_when_there_is_no_symlink(): void
    {
        Storage::fake('public');
        ob_start();
        imagejpeg(imagecreatetruecolor(8, 8));
        Storage::disk('public')->put('media/pic.jpg', ob_get_clean());

        $response = $this->get('/storage/media/pic.jpg');

        $response->assertOk();
        $this->assertSame('image/jpeg', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('max-age=86400', (string) $response->headers->get('Cache-Control'));
    }

    public function test_the_media_route_cannot_read_other_files(): void
    {
        Storage::fake('public');

        $this->get('/storage/missing.jpg')->assertNotFound();
        $this->get('/storage/..%2F..%2F..%2F.env')->assertNotFound();
        $this->get('/storage/media/../../../../.env')->assertNotFound();
        $this->get('/storage/%2e%2e/%2e%2e/composer.json')->assertNotFound();
    }

    /* ------------------------------ "Update database" for servers without a terminal ------------------------------ */

    public function test_admins_are_told_when_a_newer_version_needs_a_database_update(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $regular = User::factory()->create();

        Cache::forget('pending-migrations');
        $this->assertSame(0, UpdateController::pending());

        // Pretend the latest migration has not been applied yet (as after uploading a newer release).
        DB::table('migrations')->where('migration', 'like', '%add_label_to_social_accounts')->delete();
        Cache::forget('pending-migrations');

        $this->actingAs($admin)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('pendingMigrations', 1));
        Cache::forget('pending-migrations');
        $this->actingAs($regular)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('pendingMigrations', 0));
    }

    public function test_only_admins_can_run_the_update_and_it_reports_success(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $regular = User::factory()->create();

        $this->actingAs($regular)->post('/admin/update')->assertNotFound();
        $this->actingAs($admin)->post('/admin/update')->assertRedirect()->assertSessionHas('success');
    }
}
