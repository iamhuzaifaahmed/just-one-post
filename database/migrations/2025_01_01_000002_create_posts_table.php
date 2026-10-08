<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->text('body')->nullable();
            $table->timestamp('scheduled_at')->nullable(); // UTC
            $table->string('media_path')->nullable();
            $table->string('media_type', 10)->nullable(); // image | video
            $table->string('media_mime', 100)->nullable();
            $table->string('status', 20)->default('scheduled'); // scheduled|publishing|published|partial|failed|cancelled
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('post_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('social_account_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('scheduled'); // scheduled|queued|publishing|published|failed|cancelled
            $table->timestamp('run_at')->nullable(); // UTC; when the dispatcher should pick this up
            $table->json('overrides')->nullable(); // e.g. youtube title/description/privacy/native_schedule
            $table->json('meta')->nullable(); // resumable state, warnings
            $table->string('external_post_id')->nullable();
            $table->text('error')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['post_id', 'social_account_id']);
            $table->index(['status', 'run_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_targets');
        Schema::dropIfExists('posts');
    }
};
