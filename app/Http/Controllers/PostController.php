<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostTarget;
use App\Models\SocialAccount;
use App\Services\PostService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function __construct(private PostService $posts) {}

    public function index(Request $request): Response
    {
        $tab = $request->query('tab', 'upcoming');
        $query = Post::with(['targets.account'])->latest('scheduled_at');

        match ($tab) {
            'published' => $query->where('status', 'published'),
            'failed' => $query->whereHas('targets', fn ($q) => $q->where('status', 'failed')),
            'all' => null,
            default => $query->whereIn('status', ['scheduled', 'publishing', 'partial']),
        };

        return Inertia::render('Posts/Index', [
            'tab' => $tab,
            'counts' => [
                'upcoming' => Post::whereIn('status', ['scheduled', 'publishing', 'partial'])->count(),
                'published' => Post::where('status', 'published')->count(),
                'failed' => Post::whereHas('targets', fn ($q) => $q->where('status', 'failed'))->count(),
                'all' => Post::count(),
            ],
            'posts' => $query->paginate(15)->withQueryString()->through(fn (Post $p) => $this->present($p)),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Posts/Composer', ['post' => null] + $this->composerProps());
    }

    public function edit(Post $post): Response
    {
        $post->load('targets.account');

        return Inertia::render('Posts/Composer', [
            'post' => $this->present($post, withOverrides: true),
        ] + $this->composerProps());
    }

    public function store(Request $request): RedirectResponse
    {
        [$data, $media] = $this->input($request);
        $publishNow = $request->input('action') === 'publish_now';

        $this->posts->create($data, $media, $publishNow);

        return redirect()->route('posts.index')->with('success', $publishNow ? 'Queued for publishing.' : 'Post scheduled.');
    }

    public function update(Request $request, Post $post): RedirectResponse
    {
        [$data, $media] = $this->input($request);
        $publishNow = $request->input('action') === 'publish_now';

        $this->posts->update($post, $data, $media, $request->boolean('remove_media'), $publishNow);

        return redirect()->route('posts.index')->with('success', 'Post updated.');
    }

    public function cancel(Post $post): RedirectResponse
    {
        $this->posts->cancel($post);

        return back()->with('success', 'Post cancelled.');
    }

    public function retry(PostTarget $target): RedirectResponse
    {
        $this->posts->retry($target);

        return back()->with('success', 'Retry queued.');
    }

    /** @return array{0: array, 1: ?\Illuminate\Http\UploadedFile} */
    private function input(Request $request): array
    {
        $request->validate([
            'body' => ['nullable', 'string', 'max:70000'],
            'scheduled_at' => ['nullable', 'date_format:Y-m-d\TH:i'],
            'targets' => ['required', 'array', 'min:1'],
            'targets.*' => ['nullable', 'array'],
            'targets.*.title' => ['nullable', 'string', 'max:200'],
            'targets.*.description' => ['nullable', 'string', 'max:6000'],
            'targets.*.privacy' => ['nullable', 'in:private,unlisted,public'],
            'targets.*.native_schedule' => ['nullable', 'boolean'],
            'media' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm', 'max:'.(int) config('social.upload_max_kb', 1024 * 1024)],
        ], [
            'targets.required' => 'Select at least one account to publish to.',
        ]);

        $targets = [];
        foreach ($request->input('targets', []) as $accountId => $overrides) {
            $targets[(int) $accountId] = is_array($overrides) ? $overrides : [];
        }

        $scheduled = $request->filled('scheduled_at') ? PostService::parseLocal($request->input('scheduled_at')) : null;

        return [[
            'body' => $request->input('body'),
            'scheduled_at' => $scheduled,
            'targets' => $targets,
        ], $request->file('media')];
    }

    private function composerProps(): array
    {
        $tz = config('social.display_timezone');

        return [
            'accounts' => $this->accounts(),
            'nowLocal' => now()->timezone($tz)->format('Y-m-d\TH:i'),
            'limits' => [
                'linkedin' => config('social.limits.linkedin.text'),
                'facebook' => config('social.limits.facebook.text'),
                'instagram' => config('social.limits.instagram.text'),
                'youtube' => config('social.limits.youtube.description_bytes'),
            ],
        ];
    }

    private function accounts(): array
    {
        return SocialAccount::orderBy('platform')->orderBy('display_name')->get()
            ->map(fn ($a) => [
                'id' => $a->id, 'platform' => $a->platform, 'display_name' => $a->shown_name,
                'needs_reconnect' => $a->needsReconnect(),
            ])->all();
    }

    private function present(Post $post, bool $withOverrides = false): array
    {
        $tz = config('social.display_timezone');
        $editable = ! $post->targets->contains(fn ($t) => in_array($t->status, ['published', 'queued', 'publishing']));

        return [
            'id' => $post->id,
            'body' => $post->body,
            'status' => $post->status,
            'media_type' => $post->media_type,
            'media_url' => $post->media_path ? '/storage/'.$post->media_path : null,
            'scheduled_display' => $post->scheduled_at?->timezone($tz)->format('M j, Y H:i'),
            'scheduled_local' => $post->scheduled_at?->timezone($tz)->format('Y-m-d\TH:i'),
            'editable' => $editable,
            'cancellable' => $post->targets->contains(fn ($t) => in_array($t->status, ['scheduled', 'queued', 'failed'])),
            'targets' => $post->targets->map(fn ($t) => [
                'id' => $t->id,
                'account_id' => $t->social_account_id,
                'platform' => $t->account->platform,
                'account' => $t->account->shown_name,
                'status' => $t->status,
                'error' => $t->error,
                'warning' => $t->meta['warning'] ?? null,
                'external_post_id' => $t->external_post_id,
                'published_at' => $t->published_at?->timezone($tz)->format('M j, Y H:i'),
                'attempts' => $t->attempts,
                'overrides' => $withOverrides ? ($t->overrides ?? []) : null,
            ])->values(),
        ];
    }
}
