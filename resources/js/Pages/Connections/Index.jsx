import Icon from '@/Components/Icon';
import PageHeader, { EmptyState } from '@/Components/PageHeader';
import PlatformIcon from '@/Components/PlatformIcon';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const PROVIDERS = [
    {
        key: 'linkedin',
        icons: ['linkedin'],
        title: 'LinkedIn',
        platforms: ['linkedin'],
        text: 'Post to a personal profile. Connect as many profiles as you like.',
        another: 'To add a different LinkedIn profile, first log out of LinkedIn (or use a private window), then press the button.',
    },
    {
        key: 'facebook',
        icons: ['facebook', 'instagram'],
        title: 'Facebook & Instagram',
        platforms: ['facebook', 'instagram'],
        text: 'Every Page you pick, plus the Instagram Business account linked to each Page.',
        another: 'To add more Pages, press the button, then in the Facebook window choose “Edit settings” and tick the extra Pages.',
    },
    {
        key: 'youtube',
        icons: ['youtube'],
        title: 'YouTube',
        platforms: ['youtube'],
        text: 'One channel per connection. Add several channels or Google accounts.',
        another: 'Press the button and pick another Google account or channel in the Google window.',
    },
];

const PLATFORM_ORDER = ['linkedin', 'facebook', 'instagram', 'youtube'];

function AccountRow({ a }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(a.label || '');

    const save = () => {
        router.patch(route('connections.rename', a.id), { label: value }, { preserveScroll: true, onSuccess: () => setEditing(false) });
    };

    const disconnect = () => {
        if (confirm(`Disconnect ${a.display_name}? Pending posts targeting it will be removed.`)) {
            router.delete(route('connections.destroy', a.id), { preserveScroll: true });
        }
    };

    const reconnectKey = a.platform === 'instagram' ? 'facebook' : a.platform;

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
            <PlatformIcon platform={a.platform} />
            <div className="min-w-0 flex-1 basis-48">
                {editing ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            save();
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            autoFocus
                            value={value}
                            maxLength={60}
                            placeholder={a.original_name}
                            onChange={(e) => setValue(e.target.value)}
                            className="input !py-1.5"
                        />
                        <button className="btn-primary btn-sm">Save</button>
                        <button type="button" onClick={() => setEditing(false)} className="btn-ghost btn-sm">
                            Cancel
                        </button>
                    </form>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-slate-900">{a.display_name}</span>
                            <button
                                onClick={() => setEditing(true)}
                                title="Give this account your own name"
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <Icon name="edit" className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="text-xs text-slate-500">
                            {a.label && <>{a.original_name} · </>}
                            {a.token_expires_at
                                ? `token expires ${a.token_expires_at}${a.has_refresh_token ? ' (auto-refreshes)' : ''}`
                                : 'token does not expire'}
                        </div>
                        {a.status_message && <div className="mt-1 text-xs text-red-600">{a.status_message}</div>}
                    </>
                )}
            </div>
            <StatusBadge status={a.token_state} />
            <div className="flex gap-2">
                {a.token_state !== 'ok' && (
                    <a href={route('connections.redirect', reconnectKey)} className="btn-secondary btn-sm">
                        <Icon name="refresh" className="h-3.5 w-3.5" /> Reconnect
                    </a>
                )}
                <button onClick={disconnect} className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
                    Disconnect
                </button>
            </div>
        </div>
    );
}

export default function Index({ accounts, configured }) {
    const { platforms } = usePage().props;

    const countFor = (p) => accounts.filter((a) => p.platforms.includes(a.platform)).length;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Connections"
                    subtitle="Connect as many accounts as you need: several Pages, profiles, Instagram accounts and channels."
                    actions={
                        <Link href={route('guide', { tab: 'more' })} className="btn-secondary">
                            <Icon name="book" className="h-4 w-4" /> How to add more accounts
                        </Link>
                    }
                />
            }
        >
            <Head title="Connections" />

            <div className="space-y-8">
                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {PROVIDERS.map((p) => {
                        const n = countFor(p);
                        return (
                            <div key={p.key} className="card flex flex-col p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex -space-x-2">
                                        {p.icons.map((i) => (
                                            <PlatformIcon key={i} platform={i} size="lg" className="ring-4 ring-white" />
                                        ))}
                                    </div>
                                    {n > 0 && (
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                            {n} connected
                                        </span>
                                    )}
                                </div>
                                <h3 className="mt-4 font-semibold text-slate-900">{p.title}</h3>
                                <p className="mt-1 text-sm text-slate-500">{p.text}</p>
                                {n > 0 && configured[p.key] && (
                                    <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500">{p.another}</p>
                                )}
                                <div className="flex-1" />
                                {configured[p.key] ? (
                                    <a href={route('connections.redirect', p.key)} className="btn-primary mt-4">
                                        <Icon name={n > 0 ? 'plus' : 'link'} className="h-4 w-4" />
                                        {n > 0 ? 'Connect another account' : 'Connect'}
                                    </a>
                                ) : (
                                    <Link href={route('settings.index')} className="btn-secondary mt-4">
                                        <Icon name="key" className="h-4 w-4" /> Add credentials first
                                    </Link>
                                )}
                                <Link
                                    href={route('guide', { tab: p.key === 'facebook' ? 'meta' : p.key })}
                                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    <Icon name="book" className="h-4 w-4" /> Step-by-step guide
                                </Link>
                            </div>
                        );
                    })}
                </section>

                <section className="space-y-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Connected accounts ({accounts.length})
                    </h2>
                    {accounts.length === 0 ? (
                        <EmptyState icon={<Icon name="link" />} title="No accounts connected yet">
                            Use the cards above to authorize your first account.
                        </EmptyState>
                    ) : (
                        PLATFORM_ORDER.map((platform) => {
                            const list = accounts.filter((a) => a.platform === platform);
                            if (list.length === 0) return null;
                            return (
                                <div key={platform}>
                                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <PlatformIcon platform={platform} size="sm" />
                                        {platforms[platform]}
                                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">{list.length}</span>
                                    </div>
                                    <div className="card divide-y divide-slate-100">
                                        {list.map((a) => (
                                            <AccountRow key={a.id} a={a} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
