import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import PlatformIcon, { PlatformStack } from '@/Components/PlatformIcon';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

function Stat({ label, value, href, icon, tone }) {
    return (
        <Link href={href} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon name={icon} className="h-5 w-5" />
            </span>
            <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
        </Link>
    );
}

function Step({ done, n, title, text, href, cta }) {
    return (
        <li className="flex items-start gap-4">
            <span
                className={
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ' +
                    (done ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700')
                }
            >
                {done ? <Icon name="check" className="h-4 w-4" strokeWidth={2.5} /> : n}
            </span>
            <div className="flex-1">
                <div className={'font-medium ' + (done ? 'text-slate-400 line-through' : 'text-slate-900')}>{title}</div>
                {!done && <div className="text-sm text-slate-500">{text}</div>}
            </div>
            {!done && (
                <Link href={href} className="btn-secondary btn-sm">
                    {cta}
                </Link>
            )}
        </li>
    );
}

export default function Dashboard({ needsReconnect, expiring, counts, upcoming, failures, setup }) {
    const { auth, platforms } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];
    const allSet = setup.credentials && setup.accounts && setup.posts;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={`Hi ${firstName} 👋`}
                    subtitle="Here's what's happening with your posts."
                    actions={
                        <Link href={route('posts.create')} className="btn-primary">
                            <Icon name="plus" className="h-4 w-4" /> New post
                        </Link>
                    }
                />
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {!allSet && (
                    <section className="card p-6">
                        <h2 className="font-semibold text-slate-900">Get started</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Three quick steps and you're publishing.{' '}
                            <Link href={route('guide')} className="font-medium text-indigo-600 hover:text-indigo-500">
                                New to this? Open the step-by-step guide →
                            </Link>
                        </p>
                        <ol className="mt-5 space-y-5">
                            <Step
                                n={1}
                                done={setup.credentials}
                                title="Add your developer app credentials"
                                text="Paste the client IDs and secrets from LinkedIn, Meta and Google."
                                href={route('settings.index')}
                                cta="Open settings"
                            />
                            <Step
                                n={2}
                                done={setup.accounts}
                                title="Connect your accounts"
                                text="Authorize LinkedIn, your Facebook Page / Instagram and YouTube channel."
                                href={route('connections.index')}
                                cta="Connect"
                            />
                            <Step
                                n={3}
                                done={setup.posts}
                                title="Schedule your first post"
                                text="Write it once, choose the platforms and the time."
                                href={route('posts.create')}
                                cta="Create post"
                            />
                        </ol>
                    </section>
                )}

                {needsReconnect.length > 0 && (
                    <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
                        <div className="flex-1">
                            <div className="font-semibold">Reconnect needed</div>
                            <ul className="mt-1 space-y-0.5">
                                {needsReconnect.map((a) => (
                                    <li key={a.id}>
                                        {platforms[a.platform]} · {a.display_name}
                                        {a.status_message ? <span className="text-red-600"> — {a.status_message}</span> : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <Link href={route('connections.index')} className="btn-sm btn-danger self-start">
                            Fix now
                        </Link>
                    </div>
                )}

                {expiring.length > 0 && (
                    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <Icon name="clock" className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                            Tokens expiring soon — reconnect to renew:{' '}
                            <strong>{expiring.map((a) => `${platforms[a.platform]} ${a.display_name} (${a.expires})`).join(', ')}</strong>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Stat label="Connected accounts" value={counts.accounts} icon="link" tone="bg-indigo-50 text-indigo-600" href={route('connections.index')} />
                    <Stat label="Upcoming posts" value={counts.upcoming} icon="clock" tone="bg-sky-50 text-sky-600" href={route('posts.index')} />
                    <Stat label="Published" value={counts.published} icon="checkCircle" tone="bg-emerald-50 text-emerald-600" href={route('posts.index', { tab: 'published' })} />
                    <Stat label="Failed" value={counts.failed} icon="alert" tone="bg-red-50 text-red-600" href={route('posts.index', { tab: 'failed' })} />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="card min-w-0 lg:col-span-2">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="font-semibold text-slate-900">Up next</h2>
                            <Link href={route('posts.index')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                View all
                            </Link>
                        </div>
                        {upcoming.length === 0 ? (
                            <div className="px-5 py-12 text-center text-sm text-slate-500">
                                Nothing scheduled.{' '}
                                <Link href={route('posts.create')} className="font-medium text-indigo-600">
                                    Create a post
                                </Link>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {upcoming.map((p) => (
                                    <li key={p.id}>
                                        <Link href={route('posts.edit', p.id)} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                                            <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-slate-100 py-2 text-center">
                                                <span className="text-[10px] font-semibold uppercase text-slate-500">
                                                    {p.scheduled_display.split(',')[0]}
                                                </span>
                                                <span className="text-sm font-bold text-slate-800">
                                                    {p.scheduled_display.split('·')[1]?.trim()}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-slate-900">
                                                    {p.body || <em className="text-slate-400">(media only)</em>}
                                                </p>
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <PlatformStack targets={p.targets} />
                                                    {p.media_type && (
                                                        <Icon name={p.media_type === 'video' ? 'video' : 'image'} className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </div>
                                            </div>
                                            <StatusBadge status={p.status} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="card min-w-0">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <h2 className="font-semibold text-slate-900">Needs attention</h2>
                        </div>
                        {failures.length === 0 ? (
                            <div className="flex flex-col items-center px-5 py-12 text-center text-sm text-slate-500">
                                <Icon name="checkCircle" className="mb-2 h-8 w-8 text-emerald-400" />
                                All clear — no failed posts.
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {failures.map((f) => (
                                    <li key={f.id} className="space-y-2 px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <PlatformIcon platform={f.platform} size="sm" />
                                            <span className="truncate text-sm font-medium text-slate-900">{f.account}</span>
                                        </div>
                                        <p className="line-clamp-2 text-xs text-red-600">{f.error}</p>
                                        <button
                                            onClick={() => router.post(route('targets.retry', f.id), {}, { preserveScroll: true })}
                                            className="btn-secondary btn-sm"
                                        >
                                            <Icon name="refresh" className="h-3.5 w-3.5" /> Retry
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
