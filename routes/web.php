<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\UpdateController as AdminUpdateController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\ConnectionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuideController;
use App\Http\Controllers\ManualConnectionController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

// Uploaded media (public/storage symlink normally serves these before the app is reached)
Route::get('/storage/{path}', [MediaController::class, 'show'])->where('path', '.*')->name('media.show');

Route::get('/', fn () => redirect()->route(auth()->check() ? 'dashboard' : 'login'));

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // Ends an admin's "log in as" session (only works when one is active).
    Route::post('/impersonate/stop', [ImpersonationController::class, 'stop'])->name('impersonate.stop');

    Route::get('/connections', [ConnectionController::class, 'index'])->name('connections.index');
    Route::get('/connections/{platform}/redirect', [ConnectionController::class, 'redirect'])
        ->whereIn('platform', ['linkedin', 'facebook', 'youtube', 'threads', 'x'])->name('connections.redirect');
    Route::get('/connections/{platform}/callback', [ConnectionController::class, 'callback'])
        ->whereIn('platform', ['linkedin', 'facebook', 'youtube', 'threads', 'x'])->name('connections.callback');
    Route::post('/connections/telegram', [ManualConnectionController::class, 'telegram'])->name('connections.telegram');
    Route::post('/connections/discord', [ManualConnectionController::class, 'discord'])->name('connections.discord');
    Route::post('/connections/wordpress', [ManualConnectionController::class, 'wordpress'])->name('connections.wordpress');
    Route::patch('/connections/{account}', [ConnectionController::class, 'rename'])->name('connections.rename');
    Route::delete('/connections/{account}', [ConnectionController::class, 'destroy'])->name('connections.destroy');

    Route::get('/posts', [PostController::class, 'index'])->name('posts.index');
    Route::get('/posts/create', [PostController::class, 'create'])->name('posts.create');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->name('posts.edit');
    Route::post('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::post('/posts/{post}/cancel', [PostController::class, 'cancel'])->name('posts.cancel');
    Route::post('/targets/{target}/retry', [PostController::class, 'retry'])->name('targets.retry');

    Route::get('/guide', GuideController::class)->name('guide');

    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::put('/settings', [SettingsController::class, 'update'])->name('settings.update');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin panel (admins only; everyone else gets a 404)
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', AdminDashboardController::class)->name('dashboard');
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('/users/{user}/suspend', [AdminUserController::class, 'suspend'])->name('users.suspend');
    Route::post('/users/{user}/unsuspend', [AdminUserController::class, 'unsuspend'])->name('users.unsuspend');
    Route::post('/users/{user}/admin', [AdminUserController::class, 'toggleAdmin'])->name('users.admin');
    Route::post('/users/{user}/impersonate', [ImpersonationController::class, 'start'])->name('users.impersonate');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    Route::post('/update', [AdminUpdateController::class, 'run'])->name('update');
    Route::get('/settings', [AdminSettingsController::class, 'index'])->name('settings.index');
    Route::put('/settings', [AdminSettingsController::class, 'update'])->name('settings.update');
});

require __DIR__.'/auth.php';
