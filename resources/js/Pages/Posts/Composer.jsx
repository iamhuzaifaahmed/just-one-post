import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import PageHeader from '@/Components/PageHeader';
import PlatformIcon from '@/Components/PlatformIcon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

const ORDER = ['linkedin', 'facebook', 'instagram', 'youtube', 'threads', 'x', 'telegram', 'discord', 'wordpress'];
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm';

/* ---- date helpers: "YYYY-MM-DDTHH:mm" strings in the display timezone ---- */
const toDate = (local) => new Date(local + ':00Z');
const toLocal = (d) => d.toISOString().slice(0, 16);
const addMinutes = (local, m) => toLocal(new Date(toDate(local).getTime() + m * 60000));
const atHour = (local, dayOffset, hour) => {
    const d = toDate(local);
    d.setUTCDate(d.getUTCDate() + dayOffset);
    d.setUTCHours(hour, 0, 0, 0);
    return toLocal(d);
};
const nextMonday = (local) => {
    const d = toDate(local);
    const add = ((8 - d.getUTCDay()) % 7) || 7;
    return atHour(local, add, 9);
};
const pretty = (local) =>
    local
        ? toDate(local).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
          })
        : '';

function formatSize(bytes) {
    if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

function Step({ n, title, hint, children }) {
    return (
        <section className="card p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {n}
                </span>
                <div>
                    <h2 className="font-semibold text-slate-900">{title}</h2>
                    {hint && <p className="hint">{hint}</p>}
                </div>
            </div>
            {children}
        </section>
    );
}

export default function Composer({ post, accounts, limits, nowLocal }) {
    const { platforms, timezone, auth } = usePage().props;
    const editing = !!post;
    const fileInput = useRef(null);
    const [dragging, setDragging] = useState(false);

    const initialTargets = useMemo(() => {
        const t = {};
        (post?.targets || []).forEach((x) => {
            t[x.account_id] = { selected: 1, ...(x.overrides || {}) };
        });
        return t;
    }, [post]);

    const { data, setData, post: submit, transform, processing, errors, progress } = useForm({
        body: post?.body || '',
        media: null,
        remove_media: false,
        scheduled_at: post?.scheduled_local || '',
        targets: initialTargets,
        action: 'schedule',
    });

    /* ---- media preview ---- */
    const [previewUrl, setPreviewUrl] = useState(null);
    useEffect(() => {
        if (!data.media) return setPreviewUrl(null);
        const url = URL.createObjectURL(data.media);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [data.media]);

    const existing = post?.media_url && !data.remove_media && !data.media ? { url: post.media_url, type: post.media_type } : null;
    const media = data.media
        ? { url: previewUrl, type: data.media.type.startsWith('video/') ? 'video' : 'image', name: data.media.name, size: data.media.size }
        : existing;

    const pickFile = (file) => {
        if (!file) return;
        setData((d) => ({ ...d, media: file, remove_media: false }));
    };

    /* ---- targets ---- */
    const selectedAccounts = accounts.filter((a) => data.targets[a.id]);
    const toggle = (id) =>
        setData((d) => {
            const t = { ...d.targets };
            if (t[id]) delete t[id];
            else t[id] = { selected: 1 };
            return { ...d, targets: t };
        });
    const setGroup = (ids, on) =>
        setData((d) => {
            const t = { ...d.targets };
            ids.forEach((id) => (on ? (t[id] = t[id] || { selected: 1 }) : delete t[id]));
            return { ...d, targets: t };
        });
    const setOverride = (id, key, value) =>
        setData((d) => ({ ...d, targets: { ...d.targets, [id]: { ...d.targets[id], [key]: value } } }));

    /* ---- live checks (advisory; the server validates for real) ---- */
    const warnings = [];
    const counters = [];
    const seen = new Set();
    selectedAccounts.forEach((a) => {
        if (seen.has(a.platform)) return;
        seen.add(a.platform);
        const len = a.platform === 'youtube' ? new Blob([data.body]).size : data.body.length;
        if (limits[a.platform]) {
            counters.push({ platform: a.platform, len, max: limits[a.platform], over: len > limits[a.platform] });
            if (len > limits[a.platform]) warnings.push(`${platforms[a.platform]}: text is over the ${limits[a.platform]} limit.`);
        }
        if (a.platform === 'threads' || a.platform === 'instagram') {
            if (media && window.location.hostname === 'localhost') warnings.push(`${platforms[a.platform]} downloads media from a public link: set a Public base URL in Settings (see the guide).`);
        }
        if (a.platform === 'instagram' && !media) warnings.push('Instagram needs an image or a video.');
        if (a.platform === 'youtube' && media?.type !== 'video') warnings.push('YouTube needs a video.');
    });

    /* ---- schedule ---- */
    const quick = [
        ['In 1 hour', addMinutes(nowLocal, 60)],
        ['Today 20:00', atHour(nowLocal, 0, 20)],
        ['Tomorrow 09:00', atHour(nowLocal, 1, 9)],
        ['Tomorrow 18:00', atHour(nowLocal, 1, 18)],
        ['Next Monday 09:00', nextMonday(nowLocal)],
    ].filter(([, v]) => v > addMinutes(nowLocal, 5));

    const send = (action) => {
        transform((d) => ({ ...d, action }));
        submit(editing ? route('posts.update', post.id) : route('posts.store'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const errorList = Object.entries(errors).flatMap(([k, v]) =>
        k === 'targets' || k.startsWith('targets.') || k === 'post' ? [].concat(v) : [],
    );
    const canSubmit = selectedAccounts.length > 0 && !processing;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={editing ? 'Edit post' : 'New post'}
                    subtitle="Write it once, choose where it goes and when."
                    actions={
                        <Link href={route('posts.index')} className="btn-ghost">
                            <Icon name="x" className="h-4 w-4" /> Close
                        </Link>
                    }
                />
            }
        >
            <Head title={editing ? 'Edit post' : 'New post'} />

            <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-6">
                    {/* 1. Content */}
                    <Step n={1} title="Content" hint="Text is shared by every platform. Add an image or a video if you like.">
                        <textarea
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            rows={7}
                            placeholder="What do you want to share?"
                            className="input resize-y"
                        />
                        <InputError message={errors.body} className="mt-1" />

                        {counters.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {counters.map((c) => (
                                    <span
                                        key={c.platform}
                                        className={
                                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' +
                                            (c.over ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600')
                                        }
                                    >
                                        <PlatformIcon platform={c.platform} size="sm" className="!h-4 !w-4 !rounded" />
                                        {c.len.toLocaleString()} / {c.max.toLocaleString()}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="mt-5">
                            <input
                                ref={fileInput}
                                type="file"
                                accept={ACCEPT}
                                className="hidden"
                                onChange={(e) => pickFile(e.target.files[0])}
                            />
                            {media ? (
                                <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-3">
                                    {media.type === 'image' ? (
                                        <img src={media.url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-900 text-white">
                                            <Icon name="video" className="h-6 w-6" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1 text-sm">
                                        <div className="truncate font-medium text-slate-800">{media.name || `Attached ${media.type}`}</div>
                                        <div className="text-xs text-slate-500">
                                            {media.size ? formatSize(media.size) : 'Already uploaded'}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => fileInput.current?.click()} className="btn-secondary btn-sm">
                                        Replace
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData((d) => ({ ...d, media: null, remove_media: true }))}
                                        className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInput.current?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragging(true);
                                    }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragging(false);
                                        pickFile(e.dataTransfer.files[0]);
                                    }}
                                    className={
                                        'flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ' +
                                        (dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50')
                                    }
                                >
                                    <Icon name="upload" className="h-7 w-7 text-slate-400" />
                                    <div className="mt-2 text-sm font-medium text-slate-700">Drop an image or video, or click to browse</div>
                                    <div className="hint mt-0.5">JPG, PNG, GIF, WEBP, MP4, MOV, WEBM</div>
                                </div>
                            )}
                            {progress && (
                                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                    <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${progress.percentage}%` }} />
                                </div>
                            )}
                            <InputError message={errors.media} className="mt-2" />
                        </div>
                    </Step>

                    {/* 2. Platforms */}
                    <Step n={2} title="Publish to" hint="Pick one or more connected accounts.">
                        {accounts.length === 0 ? (
                            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                                No accounts connected yet.{' '}
                                <Link href={route('connections.index')} className="font-medium text-indigo-600">
                                    Connect an account
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {ORDER.map((platform) => {
                                    const list = accounts.filter((a) => a.platform === platform);
                                    if (list.length === 0) return null;
                                    const usable = list.filter((a) => !a.needs_reconnect);
                                    const allOn = usable.length > 0 && usable.every((a) => data.targets[a.id]);
                                    return (
                                        <div key={platform}>
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                    <PlatformIcon platform={platform} size="sm" />
                                                    {platforms[platform]}
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{list.length}</span>
                                                </div>
                                                {usable.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setGroup(usable.map((a) => a.id), !allOn)}
                                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                                                    >
                                                        {allOn ? 'Clear all' : 'Select all'}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                {list.map((a) => {
                                                    const on = !!data.targets[a.id];
                                                    return (
                                                        <button
                                                            key={a.id}
                                                            type="button"
                                                            disabled={a.needs_reconnect}
                                                            onClick={() => toggle(a.id)}
                                                            className={
                                                                'flex items-center gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ' +
                                                                (on ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')
                                                            }
                                                        >
                                                            <PlatformIcon platform={a.platform} />
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-sm font-medium text-slate-900">{a.display_name}</span>
                                                                <span className="block text-xs text-slate-500">
                                                                    {a.needs_reconnect ? 'Needs reconnect' : platforms[a.platform]}
                                                                </span>
                                                            </span>
                                                            <span
                                                                className={
                                                                    'flex h-5 w-5 items-center justify-center rounded-full border ' +
                                                                    (on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300')
                                                                }
                                                            >
                                                                {on && <Icon name="check" className="h-3 w-3" strokeWidth={3} />}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {errorList.length > 0 && (
                            <ul className="mt-4 space-y-1 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                                {errorList.map((m, i) => (
                                    <li key={i} className="flex gap-2">
                                        <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /> {m}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {selectedAccounts
                            .filter((a) => a.platform === 'wordpress')
                            .map((a) => {
                                const t = data.targets[a.id];
                                return (
                                    <div key={a.id} className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                            <PlatformIcon platform="wordpress" size="sm" /> WordPress options · {a.display_name}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Post title (defaults to the first line of the text)"
                                            value={t.title || ''}
                                            maxLength={200}
                                            onChange={(e) => setOverride(a.id, 'title', e.target.value)}
                                            className="input"
                                        />
                                        <label className="flex items-center gap-2 text-sm">
                                            <span className="text-slate-600">Status</span>
                                            <select
                                                value={t.status || 'publish'}
                                                onChange={(e) => setOverride(a.id, 'status', e.target.value)}
                                                className="input !w-auto !py-1.5"
                                            >
                                                <option value="publish">Publish</option>
                                                <option value="draft">Save as draft</option>
                                                <option value="pending">Pending review</option>
                                            </select>
                                        </label>
                                    </div>
                                );
                            })}

                        {selectedAccounts
                            .filter((a) => a.platform === 'youtube')
                            .map((a) => {
                                const t = data.targets[a.id];
                                return (
                                    <div key={a.id} className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                            <PlatformIcon platform="youtube" size="sm" /> YouTube options · {a.display_name}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Title (defaults to the first line of the text)"
                                            value={t.title || ''}
                                            maxLength={100}
                                            onChange={(e) => setOverride(a.id, 'title', e.target.value)}
                                            className="input"
                                        />
                                        <textarea
                                            placeholder="Description (defaults to the text)"
                                            value={t.description || ''}
                                            rows={3}
                                            onChange={(e) => setOverride(a.id, 'description', e.target.value)}
                                            className="input"
                                        />
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                                            <label className="flex items-center gap-2">
                                                <span className="text-slate-600">Privacy</span>
                                                <select
                                                    value={t.privacy || 'private'}
                                                    onChange={(e) => setOverride(a.id, 'privacy', e.target.value)}
                                                    className="input !w-auto !py-1.5"
                                                >
                                                    <option value="private">Private</option>
                                                    <option value="unlisted">Unlisted</option>
                                                    <option value="public">Public</option>
                                                </select>
                                            </label>
                                            <label className="flex items-start gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={!!t.native_schedule}
                                                    onChange={(e) => setOverride(a.id, 'native_schedule', e.target.checked)}
                                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-slate-600">
                                                    Upload now as private; YouTube publishes at the scheduled time
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                    </Step>

                    {/* 3. Schedule */}
                    <Step n={3} title="When" hint={`Times are in ${timezone}. Leave empty and use “Publish now” to post immediately.`}>
                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                type="datetime-local"
                                value={data.scheduled_at}
                                min={nowLocal}
                                onChange={(e) => setData('scheduled_at', e.target.value)}
                                className="input !w-auto"
                            />
                            {data.scheduled_at && (
                                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                                    <Icon name="calendar" className="h-4 w-4 text-slate-400" /> {pretty(data.scheduled_at)}
                                </span>
                            )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {quick.map(([label, value]) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => setData('scheduled_at', value)}
                                    className={
                                        'rounded-full border px-3 py-1 text-xs font-medium transition ' +
                                        (data.scheduled_at === value
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                                    }
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.scheduled_at} className="mt-2" />
                    </Step>

                    {/* Actions */}
                    <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50/90 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
                        <button type="button" disabled={!canSubmit} onClick={() => send('schedule')} className="btn-primary">
                            <Icon name="calendar" className="h-4 w-4" />
                            {processing ? 'Saving…' : editing ? 'Save & schedule' : 'Schedule post'}
                        </button>
                        <button type="button" disabled={!canSubmit} onClick={() => send('publish_now')} className="btn-secondary">
                            <Icon name="send" className="h-4 w-4" /> Publish now
                        </button>
                        {selectedAccounts.length === 0 && <span className="hint">Select at least one account.</span>}
                    </div>
                </div>

                {/* Preview */}
                <aside className="space-y-4 xl:sticky xl:top-6">
                    <div className="card overflow-hidden">
                        <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Preview
                        </div>
                        <div className="p-5">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400 font-bold text-white">
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </span>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{auth.user.name}</div>
                                    <div className="text-xs text-slate-500">
                                        {data.scheduled_at ? pretty(data.scheduled_at) : 'Publish time not set'}
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-800">
                                {data.body || <span className="text-slate-400">Your text will appear here…</span>}
                            </p>
                            {media && (
                                <div className="mt-4 overflow-hidden rounded-xl bg-slate-100">
                                    {media.type === 'image' ? (
                                        <img src={media.url} alt="" className="max-h-72 w-full object-cover" />
                                    ) : (
                                        <video src={media.url} controls className="max-h-72 w-full bg-black" />
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
                            <span className="text-xs text-slate-500">Going to</span>
                            {selectedAccounts.length === 0 ? (
                                <span className="text-xs text-slate-400">nowhere yet</span>
                            ) : (
                                <span className="flex -space-x-1.5">
                                    {selectedAccounts.map((a) => (
                                        <PlatformIcon key={a.id} platform={a.platform} size="sm" className="ring-2 ring-slate-50" />
                                    ))}
                                </span>
                            )}
                        </div>
                    </div>

                    {warnings.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <div className="mb-1 flex items-center gap-2 font-semibold">
                                <Icon name="alert" className="h-4 w-4" /> Heads up
                            </div>
                            <ul className="list-disc space-y-0.5 ps-5">
                                {warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>
            </form>
        </AuthenticatedLayout>
    );
}
