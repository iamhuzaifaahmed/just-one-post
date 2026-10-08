import Icon from '@/Components/Icon';
import PageHeader, { EmptyState } from '@/Components/PageHeader';
import PlatformIcon from '@/Components/PlatformIcon';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

const TABS = [
    ['upcoming', 'Upcoming'],
    ['published', 'Published'],
    ['failed', 'Failed'],
    ['all', 'All'],
];

export default function Index({ tab, counts, posts }) {
    const { platforms, timezone } = usePage().props;

    const cancel = (p) => {
        if (confirm('Cancel this post? Anything not yet published will not be sent.')) {
            router.post(route('posts.cancel', p.id), {}, { preserveScroll: true });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Posts"
                    subtitle={`All times shown in ${timezone}.`}
                    actions={
                        <Link href={route('posts.create')} className="btn-primary">
                            <Icon name="plus" className="h-4 w-4" /> New post
                        </Link>
                    }
                />
            }
        >
            <Head title="Posts" />

            <div className="mb-5 flex w-full max-w-full overflow-x-auto rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-slate-200/70 p-1 sm:inline-flex sm:w-auto">
                {TABS.map(([key, label]) => (
                    <Link
                        key={key}
                        href={route('posts.index', { tab: key })}
                        className={
                            'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] font-medium transition sm:flex-none sm:gap-2 sm:px-4 sm:text-sm ' +
                            (tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900')
                        }
                    >
                        {label}
                        <span
                            className={
                                'rounded-full px-1.5 text-xs ' +
                                (key === 'failed' && counts[key] > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500')
                            }
                        >
                            {counts[key]}
                        </span>
                    </Link>
                ))}
            </div>

            {posts.data.length === 0 ? (
                <EmptyState icon={<Icon name="posts" />} title="Nothing here yet">
                    {tab === 'upcoming' ? 'Scheduled posts will show up in this tab.' : 'No posts match this filter.'}
                </EmptyState>
            ) : (
                <div className="space-y-4">
                    {posts.data.map((p) => (
                        <article key={p.id} className="card overflow-hidden">
                            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                                {p.media_url && p.media_type === 'image' ? (
                                    <img src={p.media_url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                                ) : p.media_type === 'video' ? (
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                                        <Icon name="video" className="h-7 w-7" />
                                    </div>
                                ) : null}

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={p.status} />
                                        <span className="flex items-center gap-1 text-sm text-slate-500">
                                            <Icon name="calendar" className="h-4 w-4" /> {p.scheduled_display}
                                        </span>
                                    </div>
                                    <p className="mt-2 line-clamp-3 whitespace-pre-line text-slate-800">
                                        {p.body || <em className="text-slate-400">(no text)</em>}
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                                    {p.editable && (
                                        <Link href={route('posts.edit', p.id)} className="btn-secondary btn-sm">
                                            <Icon name="edit" className="h-3.5 w-3.5" /> Edit
                                        </Link>
                                    )}
                                    {p.cancellable && (
                                        <button onClick={() => cancel(p)} className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
                                            <Icon name="ban" className="h-3.5 w-3.5" /> Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            <ul className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/60">
                                {p.targets.map((t) => (
                                    <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                                        <PlatformIcon platform={t.platform} size="sm" />
                                        <div className="min-w-[10rem] flex-1">
                                            <div className="text-sm">
                                                <span className="font-medium text-slate-800">{platforms[t.platform]}</span>{' '}
                                                <span className="text-slate-500">· {t.account}</span>
                                            </div>
                                            {t.published_at && <div className="text-xs text-slate-500">Published {t.published_at}</div>}
                                            {t.error && (
                                                <div className="mt-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{t.error}</div>
                                            )}
                                            {t.warning && (
                                                <div className="mt-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">{t.warning}</div>
                                            )}
                                        </div>
                                        <StatusBadge status={t.status} />
                                        {t.status === 'failed' && (
                                            <button
                                                onClick={() => router.post(route('targets.retry', t.id), {}, { preserveScroll: true })}
                                                className="btn-secondary btn-sm"
                                            >
                                                <Icon name="refresh" className="h-3.5 w-3.5" /> Retry
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}

                    {posts.links.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-1 pt-2">
                            {posts.links.map((l, i) => (
                                <Link
                                    key={i}
                                    href={l.url || '#'}
                                    preserveScroll
                                    className={
                                        'rounded-lg px-3 py-1.5 text-sm ' +
                                        (l.active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50') +
                                        (l.url ? '' : ' pointer-events-none opacity-40')
                                    }
                                    dangerouslySetInnerHTML={{ __html: l.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
