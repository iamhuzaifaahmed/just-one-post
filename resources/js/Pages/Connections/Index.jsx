import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import PageHeader, { EmptyState } from '@/Components/PageHeader';
import PlatformIcon from '@/Components/PlatformIcon';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

/**
 * oauth  = "Connect" button that goes to the platform's login screen.
 * manual = a small form (token / webhook / password) that is checked against the real API.
 */
const PROVIDERS = [
    {
        key: 'linkedin',
        type: 'oauth',
        icons: ['linkedin'],
        title: 'LinkedIn',
        platforms: ['linkedin'],
        guide: 'linkedin',
        text: 'Post to a personal profile. Connect as many profiles as you like.',
        another: 'To add a different LinkedIn profile, first log out of LinkedIn (or use a private window), then press the button.',
    },
    {
        key: 'facebook',
        type: 'oauth',
        icons: ['facebook', 'instagram'],
        title: 'Facebook & Instagram',
        platforms: ['facebook', 'instagram'],
        guide: 'meta',
        text: 'Every Page you pick, plus the Instagram Business account linked to each Page.',
        another: 'To add more Pages, press the button, then in the Facebook window choose “Edit settings” and tick the extra Pages.',
    },
    {
        key: 'youtube',
        type: 'oauth',
        icons: ['youtube'],
        title: 'YouTube',
        platforms: ['youtube'],
        guide: 'youtube',
        text: 'One channel per connection. Add several channels or Google accounts.',
        another: 'Press the button and pick another Google account or channel in the Google window.',
    },
    {
        key: 'threads',
        type: 'oauth',
        icons: ['threads'],
        title: 'Threads',
        platforms: ['threads'],
        guide: 'threads',
        text: 'Text, image and video posts to your Threads profile. Media needs a public link.',
        another: 'To add another Threads profile, log out of threads.com (or use a private window), then press the button.',
    },
    {
        key: 'x',
        type: 'oauth',
        icons: ['x'],
        title: 'X (Twitter)',
        platforms: ['x'],
        guide: 'x',
        text: 'Posts with an image or video. X bills the API per post (pay-per-use), see the guide.',
        another: 'To add another X account, log out of x.com (or use a private window), then press the button.',
    },
    {
        key: 'telegram',
        type: 'manual',
        icons: ['telegram'],
        title: 'Telegram',
        platforms: ['telegram'],
        guide: 'telegram',
        text: 'Post to a channel or group with your own bot. No developer app needed.',
        another: 'Add as many channels or groups as you like.',
        cta: 'Add channel / group',
    },
    {
        key: 'discord',
        type: 'manual',
        icons: ['discord'],
        title: 'Discord',
        platforms: ['discord'],
        guide: 'discord',
        text: 'Post to a Discord channel with a webhook URL. Takes one minute.',
        another: 'Add one webhook per channel.',
        cta: 'Add channel webhook',
    },
    {
        key: 'wordpress',
        type: 'manual',
        icons: ['wordpress'],
        title: 'WordPress',
        platforms: ['wordpress'],
        guide: 'wordpress',
        text: 'Publish blog posts to your own WordPress site with an Application Password.',
        another: 'Add as many sites as you like.',
        cta: 'Add WordPress site',
    },
];

const MANUAL_FORMS = {
    telegram: {
        title: 'Connect a Telegram channel or group',
        route: 'connections.telegram',
        intro: 'Create a bot with @BotFather, add it to your channel as an administrator, then paste the bot token and the channel here.',
        fields: [
            { name: 'bot_token', label: 'Bot token', placeholder: '123456789:AAH…', secret: true },
            { name: 'chat_id', label: 'Channel or group', placeholder: '@mychannel   or   -1001234567890' },
        ],
    },
    discord: {
        title: 'Connect a Discord channel',
        route: 'connections.discord',
        intro: 'In Discord open Channel settings → Integrations → Webhooks → New Webhook → Copy Webhook URL, then paste it here.',
        fields: [{ name: 'webhook_url', label: 'Webhook URL', placeholder: 'https://discord.com/api/webhooks/…', secret: true }],
    },
    wordpress: {
        title: 'Connect a WordPress site',
        route: 'connections.wordpress',
        intro: 'In wp-admin open Users → Profile → Application Passwords, create one, and paste it here with your username.',
        fields: [
            { name: 'site_url', label: 'Site address', placeholder: 'https://myblog.com' },
            { name: 'username', label: 'WordPress username', placeholder: 'admin' },
            { name: 'app_password', label: 'Application Password', placeholder: 'abcd efgh ijkl mnop', secret: true },
        ],
    },
};

const PLATFORM_ORDER = ['linkedin', 'facebook', 'instagram', 'youtube', 'threads', 'x', 'telegram', 'discord', 'wordpress'];
const MANUAL = ['telegram', 'discord', 'wordpress'];

function ManualConnectModal({ platform, onClose }) {
    const def = MANUAL_FORMS[platform];
    const initial = {};
    def.fields.forEach((f) => (initial[f.name] = ''));
    const { data, setData, post, processing, errors } = useForm(initial);

    const submit = (e) => {
        e.preventDefault();
        post(route(def.route), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center" onClick={onClose}>
            <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-4 p-6">
                <div className="flex items-start gap-3">
                    <PlatformIcon platform={platform} size="lg" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-fg">{def.title}</h3>
                        <p className="mt-1 text-sm text-muted">{def.intro}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded p-1 text-muted/80 hover:bg-soft" aria-label="Close">
                        <Icon name="x" className="h-4 w-4" />
                    </button>
                </div>

                {def.fields.map((f) => (
                    <div key={f.name}>
                        <label className="label">{f.label}</label>
                        <input
                            type={f.secret ? 'password' : 'text'}
                            autoComplete="off"
                            value={data[f.name]}
                            placeholder={f.placeholder}
                            onChange={(e) => setData(f.name, e.target.value)}
                            className="input mt-1.5"
                            required
                        />
                        <InputError message={errors[f.name]} className="mt-1" />
                    </div>
                ))}

                <div className="flex items-center justify-between gap-3 pt-1">
                    <Link href={route('guide', { tab: platform })} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand">
                        <Icon name="book" className="h-4 w-4" /> Step-by-step guide
                    </Link>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancel
                        </button>
                        <button disabled={processing} className="btn-primary">
                            {processing ? 'Checking…' : 'Connect'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function AccountRow({ a, onReconnectManual }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(a.label || '');
    const manual = MANUAL.includes(a.platform);

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
                            <span className="truncate font-medium text-fg">{a.display_name}</span>
                            <button
                                onClick={() => setEditing(true)}
                                title="Give this account your own name"
                                className="rounded p-1 text-muted/80 hover:bg-soft hover:text-muted"
                            >
                                <Icon name="edit" className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="text-xs text-muted">
                            {a.label && <>{a.original_name} · </>}
                            {a.token_expires_at
                                ? `token expires ${a.token_expires_at}${a.has_refresh_token ? ' (auto-refreshes)' : ''}`
                                : 'token does not expire'}
                        </div>
                        {a.status_message && <div className="mt-1 text-xs text-red-700 dark:text-red-300">{a.status_message}</div>}
                    </>
                )}
            </div>
            <StatusBadge status={a.token_state} />
            <div className="flex gap-2">
                {a.token_state !== 'ok' &&
                    (manual ? (
                        <button onClick={() => onReconnectManual(a.platform)} className="btn-secondary btn-sm">
                            <Icon name="refresh" className="h-3.5 w-3.5" /> Update credentials
                        </button>
                    ) : (
                        <a href={route('connections.redirect', reconnectKey)} className="btn-secondary btn-sm">
                            <Icon name="refresh" className="h-3.5 w-3.5" /> Reconnect
                        </a>
                    ))}
                <button onClick={disconnect} className="btn-ghost btn-sm text-red-700 dark:text-red-300 hover:bg-red-500/10">
                    Disconnect
                </button>
            </div>
        </div>
    );
}

export default function Index({ accounts, configured }) {
    const { platforms } = usePage().props;
    const [openForm, setOpenForm] = useState(null);

    const countFor = (p) => accounts.filter((a) => p.platforms.includes(a.platform)).length;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Connections"
                    subtitle="Connect as many accounts as you need, on any platform."
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
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {PROVIDERS.map((p) => {
                        const n = countFor(p);
                        const ready = configured[p.key];
                        return (
                            <div key={p.key} className="card flex flex-col p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex -space-x-2">
                                        {p.icons.map((i) => (
                                            <PlatformIcon key={i} platform={i} size="lg" className="ring-4 ring-panel" />
                                        ))}
                                    </div>
                                    {n > 0 && (
                                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
                                            {n} connected
                                        </span>
                                    )}
                                </div>
                                <h3 className="mt-4 font-semibold text-fg">{p.title}</h3>
                                <p className="mt-1 text-sm text-muted">{p.text}</p>
                                {n > 0 && ready && <p className="mt-3 rounded-lg bg-soft p-2.5 text-xs text-muted">{p.another}</p>}
                                <div className="flex-1" />
                                {!ready ? (
                                    <Link href={route('settings.index')} className="btn-secondary mt-4">
                                        <Icon name="key" className="h-4 w-4" /> Add credentials first
                                    </Link>
                                ) : p.type === 'manual' ? (
                                    <button onClick={() => setOpenForm(p.key)} className="btn-primary mt-4">
                                        <Icon name="plus" className="h-4 w-4" /> {p.cta}
                                    </button>
                                ) : (
                                    <a href={route('connections.redirect', p.key)} className="btn-primary mt-4">
                                        <Icon name={n > 0 ? 'plus' : 'link'} className="h-4 w-4" />
                                        {n > 0 ? 'Connect another account' : 'Connect'}
                                    </a>
                                )}
                                <Link
                                    href={route('guide', { tab: p.guide })}
                                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand"
                                >
                                    <Icon name="book" className="h-4 w-4" /> Step-by-step guide
                                </Link>
                            </div>
                        );
                    })}
                </section>

                <section className="space-y-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
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
                                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg/80">
                                        <PlatformIcon platform={platform} size="sm" />
                                        {platforms[platform]}
                                        <span className="rounded-full bg-line px-2 py-0.5 text-xs font-medium text-muted">{list.length}</span>
                                    </div>
                                    <div className="card divide-y divide-line">
                                        {list.map((a) => (
                                            <AccountRow key={a.id} a={a} onReconnectManual={setOpenForm} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
            </div>

            {openForm && <ManualConnectModal key={openForm} platform={openForm} onClose={() => setOpenForm(null)} />}
        </AuthenticatedLayout>
    );
}
