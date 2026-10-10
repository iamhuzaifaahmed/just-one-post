import CopyField from '@/Components/CopyField';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import PageHeader from '@/Components/PageHeader';
import PlatformIcon from '@/Components/PlatformIcon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const GROUPS = [
    {
        id: 'linkedin',
        guide: 'linkedin',
        title: 'LinkedIn',
        icon: <PlatformIcon platform="linkedin" />,
        help: 'developers.linkedin.com → your app. Enable the products “Share on LinkedIn” and “Sign In with LinkedIn using OpenID Connect”.',
        redirect: 'linkedin',
        fields: ['linkedin_client_id', 'linkedin_client_secret'],
    },
    {
        id: 'facebook',
        guide: 'meta',
        title: 'Meta · Facebook Page & Instagram',
        icon: (
            <span className="flex -space-x-2">
                <PlatformIcon platform="facebook" className="ring-2 ring-white" />
                <PlatformIcon platform="instagram" className="ring-2 ring-white" />
            </span>
        ),
        help: 'developers.facebook.com → your app → Facebook Login. One app covers both Facebook and Instagram.',
        redirect: 'facebook',
        fields: ['facebook_client_id', 'facebook_client_secret'],
    },
    {
        id: 'google',
        guide: 'youtube',
        title: 'Google · YouTube',
        icon: <PlatformIcon platform="youtube" />,
        help: 'console.cloud.google.com → enable YouTube Data API v3 → OAuth client (Web application).',
        redirect: 'youtube',
        fields: ['google_client_id', 'google_client_secret'],
    },
    {
        id: 'threads',
        guide: 'threads',
        title: 'Threads',
        icon: <PlatformIcon platform="threads" />,
        help: 'developers.facebook.com → your Meta app → Threads use case → Settings. These are the Threads App ID and Threads App Secret (not the Facebook ones).',
        redirect: 'threads',
        fields: ['threads_client_id', 'threads_client_secret'],
    },
    {
        id: 'x',
        guide: 'x',
        title: 'X (Twitter)',
        icon: <PlatformIcon platform="x" />,
        help: 'developer.x.com → your app → Keys and tokens → OAuth 2.0 Client ID and Client Secret. X charges per post through the API (pay-per-use).',
        redirect: 'x',
        fields: ['x_client_id', 'x_client_secret'],
    },
    {
        id: 'general',
        guide: 'public',
        title: 'General',
        icon: (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Icon name="globe" />
            </span>
        ),
        help: 'Times in the composer and post list use this timezone. Everything is stored in UTC.',
        fields: ['public_base_url', 'display_timezone'],
    },
    {
        id: 'advanced',
        title: 'Advanced',
        icon: (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Icon name="settings" />
            </span>
        ),
        help: 'Change only when a platform retires an API version.',
        fields: ['meta_graph_version', 'linkedin_api_version', 'ffprobe_path'],
    },
];

const LABELS = {
    linkedin_client_id: 'Client ID',
    linkedin_client_secret: 'Client Secret',
    facebook_client_id: 'App ID',
    facebook_client_secret: 'App Secret',
    google_client_id: 'Client ID',
    google_client_secret: 'Client Secret',
    threads_client_id: 'Threads App ID',
    threads_client_secret: 'Threads App Secret',
    x_client_id: 'Client ID',
    x_client_secret: 'Client Secret',
    public_base_url: 'Public base URL',
    display_timezone: 'Display timezone',
    meta_graph_version: 'Meta Graph API version',
    linkedin_api_version: 'LinkedIn API version',
    ffprobe_path: 'ffprobe path',
};

const PLACEHOLDERS = {
    public_base_url: 'https://your-tunnel.ngrok-free.app',
    meta_graph_version: 'v25.0',
    linkedin_api_version: '202609',
    ffprobe_path: 'C:\\ffmpeg\\bin\\ffprobe.exe (optional)',
};

export default function Index({ fields, redirects, timezones }) {
    const initial = {};
    Object.entries(fields).forEach(([k, f]) => (initial[k] = f.value));
    const { data, setData, put, processing, isDirty, errors } = useForm(initial);

    const submit = (e) => {
        e.preventDefault();
        put(route('settings.update'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Settings"
                    subtitle="Your own developer-app credentials and timezone. Secrets are encrypted and never shown again after saving."
                />
            }
        >
            <Head title="Settings" />

            <form onSubmit={submit} className="max-w-3xl space-y-6 pb-24">
                {GROUPS.map((g) => ({ ...g, fields: g.fields.filter((f) => fields[f]) }))
                    .filter((g) => g.fields.length > 0)
                    .map((g) => (
                    <section key={g.id} className="card p-5 sm:p-6">
                        <div className="flex items-center gap-3">
                            {g.icon}
                            <h2 className="font-semibold text-slate-900">{g.title}</h2>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">{g.help}</p>
                        {g.guide && (
                            <Link href={route('guide', { tab: g.guide })} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                <Icon name="book" className="h-4 w-4" /> Where do I find these? Open the step-by-step guide
                            </Link>
                        )}

                        {g.redirect && (
                            <div className="mt-4">
                                <div className="hint mb-1.5">Register this redirect URI in the developer app</div>
                                <CopyField value={redirects[g.redirect]} />
                            </div>
                        )}

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {g.fields.map((k) => {
                                const f = fields[k];
                                const wide = k === 'public_base_url' || k === 'ffprobe_path';
                                return (
                                    <div key={k} className={wide ? 'sm:col-span-2' : ''}>
                                        <label className="label flex items-center gap-2">
                                            {LABELS[k]}
                                            {f.set && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                                    <Icon name="check" className="h-3 w-3" strokeWidth={3} /> saved
                                                </span>
                                            )}
                                        </label>
                                        {k === 'display_timezone' ? (
                                            <select
                                                value={data[k]}
                                                onChange={(e) => setData(k, e.target.value)}
                                                className="input mt-1.5"
                                            >
                                                {timezones.map((tz) => (
                                                    <option key={tz} value={tz}>
                                                        {tz}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={f.secret ? 'password' : 'text'}
                                                autoComplete="off"
                                                value={data[k]}
                                                placeholder={f.secret && f.set ? '•••••••••••• (leave blank to keep)' : PLACEHOLDERS[k] || ''}
                                                onChange={(e) => setData(k, e.target.value)}
                                                className="input mt-1.5"
                                            />
                                        )}
                                        <InputError message={errors[k]} className="mt-1" />
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}

                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:left-64">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 lg:px-4">
                        <span className="text-sm text-slate-500">{isDirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
                        <button type="submit" disabled={processing || !isDirty} className="btn-primary">
                            {processing ? 'Saving…' : 'Save settings'}
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
