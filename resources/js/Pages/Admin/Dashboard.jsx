import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import PlatformIcon from '@/Components/PlatformIcon';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function Stat({ label, value, icon, tone, hint }) {
    return (
        <div className="card p-5">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon name={icon} className="h-5 w-5" />
            </span>
            <div className="mt-4 text-3xl font-bold tracking-tight text-fg">{value}</div>
            <div className="text-sm text-muted">{label}</div>
            {hint && <div className="mt-1 text-xs text-muted/80">{hint}</div>}
        </div>
    );
}

function Health({ ok, title, children }) {
    return (
        <div className={'card flex gap-3 p-5 ' + (ok ? '' : 'border-red-500/30 bg-red-500/10')}>
            <span className={'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ' + (ok ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/15 text-red-700 dark:text-red-300')}>
                <Icon name={ok ? 'check' : 'alert'} className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
                <div className="font-semibold text-fg">{title}</div>
                <div className="mt-0.5 text-sm text-muted">{children}</div>
            </div>
        </div>
    );
}

export default function Dashboard({ users, accountsByPlatform, needsReconnect, postsByStatus, last24h, queue, scheduler, failures }) {
    const { platforms } = usePage().props;
    const totalAccounts = Object.values(accountsByPlatform).reduce((a, b) => a + b, 0);
    const totalPosts = Object.values(postsByStatus).reduce((a, b) => a + b, 0);

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Admin overview"
                    subtitle="Everyone on this installation: usage, health and problems."
                    actions={
                        <Link href={route('admin.users.index')} className="btn-primary">
                            <Icon name="users" className="h-4 w-4" /> Manage users
                        </Link>
                    }
                />
            }
        >
            <Head title="Admin overview" />

            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Health ok={scheduler.healthy} title="Scheduler (cron)">
                        {scheduler.last_run_minutes === null
                            ? 'Has not run yet. Scheduled posts will NOT be published until the cron job / schedule:work is running.'
                            : scheduler.healthy
                              ? `Last ran ${scheduler.last_run_minutes} min ago.`
                              : `Last ran ${scheduler.last_run_minutes} min ago. It should run every minute: check the cron job.`}
                    </Health>
                    <Health ok={queue.pending < 50 && queue.oldest_minutes < 10} title="Publishing queue">
                        {queue.pending} job(s) waiting
                        {queue.pending > 0 ? `, oldest ${queue.oldest_minutes} min` : ''}. {queue.failed} failed job(s) in the failed-jobs table.
                    </Health>
                    <Health ok={needsReconnect === 0} title="Connections">
                        {needsReconnect === 0 ? 'All connected accounts are healthy.' : `${needsReconnect} account(s) across all users need to be reconnected.`}
                    </Health>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Stat label="Users" value={users.total} icon="users" tone="bg-brand/10 text-brand" hint={`${users.admins} admin(s) · ${users.suspended} suspended`} />
                    <Stat label="New users (7 days)" value={users.new_7d} icon="plus" tone="bg-sky-500/10 text-sky-700 dark:text-sky-300" />
                    <Stat label="Published (24h)" value={last24h.published} icon="checkCircle" tone="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" />
                    <Stat label="Failed (24h)" value={last24h.failed} icon="alert" tone="bg-red-500/10 text-red-700 dark:text-red-300" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section className="card p-5">
                        <h2 className="font-semibold text-fg">Connected accounts ({totalAccounts})</h2>
                        {totalAccounts === 0 ? (
                            <p className="mt-3 text-sm text-muted">No accounts connected yet.</p>
                        ) : (
                            <ul className="mt-4 space-y-3">
                                {Object.entries(accountsByPlatform)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([platform, n]) => (
                                        <li key={platform} className="flex items-center gap-3">
                                            <PlatformIcon platform={platform} size="sm" />
                                            <span className="w-28 shrink-0 text-sm text-fg/80">{platforms[platform] || platform}</span>
                                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-soft">
                                                <span className="block h-2 rounded-full bg-brand" style={{ width: `${(n / totalAccounts) * 100}%` }} />
                                            </span>
                                            <span className="w-8 text-right text-sm font-medium text-fg">{n}</span>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </section>

                    <section className="card p-5">
                        <h2 className="font-semibold text-fg">Posts ({totalPosts})</h2>
                        {totalPosts === 0 ? (
                            <p className="mt-3 text-sm text-muted">No posts yet.</p>
                        ) : (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {Object.entries(postsByStatus).map(([status, n]) => (
                                    <span key={status} className="inline-flex items-center gap-2 rounded-xl bg-soft px-3 py-2 ring-1 ring-line">
                                        <StatusBadge status={status} />
                                        <span className="text-sm font-semibold text-fg">{n}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <section className="card overflow-hidden">
                    <div className="border-b border-line px-5 py-4">
                        <h2 className="font-semibold text-fg">Recent failures (all users)</h2>
                    </div>
                    {failures.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-muted">No failed posts. 🎉</div>
                    ) : (
                        <ul className="divide-y divide-line">
                            {failures.map((f) => (
                                <li key={f.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                                    <PlatformIcon platform={f.platform} size="sm" />
                                    <div className="min-w-0 flex-1 basis-60">
                                        <div className="text-sm">
                                            <span className="font-medium text-fg">{f.account}</span>
                                            <span className="text-muted"> · {f.user}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-red-700 dark:text-red-300">{f.error}</div>
                                    </div>
                                    <span className="text-xs text-muted/80">{f.when}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
