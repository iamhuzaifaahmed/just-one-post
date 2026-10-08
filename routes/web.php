<?php

use App\Http\Controllers\ConnectionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuideController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('dashboard'));

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::get('/connections', [ConnectionController::class, 'index'])->name('connections.index');
    Route::get('/connections/{platform}/redirect', [ConnectionController::class, 'redirect'])
        ->whereIn('platform', ['linkedin', 'facebook', 'youtube'])->name('connections.redirect');
    Route::get('/connections/{platform}/callback', [ConnectionController::class, 'callback'])
        ->whereIn('platform', ['linkedin', 'facebook', 'youtube'])->name('connections.callback');
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

require __DIR__.'/auth.php';
