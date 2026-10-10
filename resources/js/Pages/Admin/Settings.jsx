import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

const FIELD_META = {
    public_base_url: {
        label: 'Public base URL',
        placeholder: 'https://your-domain.com',
        help: 'Instagram and Threads download media from this address. Leave empty on a live site (the site address is used). On a local computer set a tunnel URL (ngrok / cloudflared).',
    },
    meta_graph_version: { label: 'Meta Graph API version', placeholder: 'v25.0', help: 'Facebook and Instagram API version. Change only when Meta retires one.' },
    linkedin_api_version: { label: 'LinkedIn API version (YYYYMM)', placeholder: '202609', help: 'Sent in the Linkedin-Version header. LinkedIn retires old versions about once a year.' },
    ffprobe_path: { label: 'ffprobe path (optional)', placeholder: '/usr/bin/ffprobe', help: 'Enables video duration and aspect-ratio checks before publishing.' },
};

export default function Settings({ fields, registrationOpen }) {
    const initial = { registration_open: registrationOpen };
    Object.entries(fields).forEach(([k, f]) => (initial[k] = f.value));
    const { data, setData, put, processing, isDirty, errors } = useForm(initial);

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.settings.update'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<PageHeader title="App settings" subtitle="Options for the whole installation. Each user keeps their own platform credentials under Settings." />}>
            <Head title="App settings" />

            <form onSubmit={submit} className="max-w-3xl space-y-6 pb-24">
                <section className="card p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="font-semibold text-fg">Registration</h2>
                            <p className="mt-1 text-sm text-muted">
                                {data.registration_open
                                    ? 'Anyone can create an account. The login page shows a “Create your account” link.'
                                    : 'Sign-ups are closed. Existing users can still log in.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={data.registration_open}
                            onClick={() => setData('registration_open', !data.registration_open)}
                            className={'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ' + (data.registration_open ? 'bg-brand' : 'bg-line')}
                        >
                            <span className={'inline-block h-5 w-5 rounded-full bg-panel shadow transition ' + (data.registration_open ? 'translate-x-6' : 'translate-x-1')} />
                        </button>
                    </div>
                </section>

                <section className="card space-y-5 p-5 sm:p-6">
                    <h2 className="font-semibold text-fg">Publishing</h2>
                    {Object.keys(fields).map((k) => (
                        <div key={k}>
                            <label className="label flex items-center gap-2">
                                {FIELD_META[k].label}
                                {fields[k].set && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                        <Icon name="check" className="h-3 w-3" strokeWidth={3} /> saved
                                    </span>
                                )}
                            </label>
                            <input
                                value={data[k]}
                                placeholder={FIELD_META[k].placeholder}
                                onChange={(e) => setData(k, e.target.value)}
                                className="input mt-1.5"
                                autoComplete="off"
                            />
                            <p className="hint mt-1">{FIELD_META[k].help}</p>
                            <InputError message={errors[k]} className="mt-1" />
                        </div>
                    ))}
                </section>

                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel/90 px-4 py-3 backdrop-blur lg:left-64">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 lg:px-4">
                        <span className="text-sm text-muted">{isDirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
                        <button type="submit" disabled={processing || !isDirty} className="btn-primary">
                            {processing ? 'Saving…' : 'Save settings'}
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
