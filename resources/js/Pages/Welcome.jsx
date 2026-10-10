import Brand from '@/Components/Brand';
import Icon from '@/Components/Icon';
import PlatformIcon from '@/Components/PlatformIcon';
import { Head, Link } from '@inertiajs/react';

const PLATFORMS = ['linkedin', 'facebook', 'instagram', 'youtube', 'threads', 'x', 'telegram', 'discord', 'wordpress'];

const FEATURES = [
    { icon: 'calendar', title: 'Schedule once, post everywhere', text: 'Write a post, tick the accounts, pick the time. It publishes by itself, even while you sleep.' },
    { icon: 'users', title: 'As many accounts as you need', text: 'Several Pages, profiles, channels and sites per platform, each with your own nickname.' },
    { icon: 'refresh', title: 'Never lose a post', text: 'Every account is its own job with automatic retries. One platform failing never blocks the others.' },
    { icon: 'image', title: 'Images and videos', text: 'Upload once and we check each platform’s limits before sending, with clear messages when something is off.' },
    { icon: 'shield', title: 'Your accounts, your keys', text: 'You connect your own developer apps, tokens are encrypted, and you can disconnect anything at any time.' },
    { icon: 'book', title: 'Step-by-step guides', text: 'Every platform has click-by-click setup help in বাংলা and English, written for non-technical people.' },
];

const STEPS = [
    ['1', 'Create your account', 'Free and quick. No credit card.'],
    ['2', 'Connect your accounts', 'Follow the guide for each platform and press Connect.'],
    ['3', 'Write, schedule, relax', 'Pick the platforms and the time. We do the rest.'],
];

export default function Welcome({ canRegister }) {
    return (
        <div className="min-h-screen bg-white">
            <Head title="Schedule posts everywhere" />

            <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
                <Brand />
                <nav className="flex items-center gap-2">
                    <Link href={route('login')} className="btn-ghost">
                        Log in
                    </Link>
                    {canRegister && (
                        <Link href={route('register')} className="btn-primary">
                            Get started
                        </Link>
                    )}
                </nav>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200 opacity-60 blur-3xl" />
                <div className="relative mx-auto max-w-4xl px-5 pb-20 pt-14 text-center sm:pt-20">
                    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                        <Icon name="send" className="h-3.5 w-3.5" /> 9 platforms · unlimited accounts
                    </span>
                    <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                        Write once.{' '}
                        <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">Publish everywhere.</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
                        Schedule posts to LinkedIn, Facebook, Instagram, YouTube, Threads, X, Telegram, Discord and WordPress from one simple dashboard.
                    </p>
                    <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                        {canRegister ? (
                            <Link href={route('register')} className="btn-primary !px-6 !py-3 text-base">
                                Create your free account
                            </Link>
                        ) : (
                            <span className="rounded-xl bg-slate-100 px-5 py-3 text-sm text-slate-500">Sign-ups are currently closed</span>
                        )}
                        <Link href={route('login')} className="btn-secondary !px-6 !py-3 text-base">
                            Log in
                        </Link>
                    </div>
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                        {PLATFORMS.map((p) => (
                            <PlatformIcon key={p} platform={p} size="lg" />
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-slate-50 py-20">
                <div className="mx-auto max-w-6xl px-5">
                    <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Everything you need, nothing you don’t</h2>
                    <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="card p-6">
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <Icon name={f.icon} className="h-5 w-5" />
                                </span>
                                <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20">
                <div className="mx-auto max-w-5xl px-5">
                    <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">How it works</h2>
                    <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                        {STEPS.map(([n, t, d]) => (
                            <div key={n} className="text-center">
                                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
                                    {n}
                                </span>
                                <h3 className="mt-4 font-semibold text-slate-900">{t}</h3>
                                <p className="mt-1 text-sm text-slate-600">{d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            {canRegister && (
                <section className="px-5 pb-20">
                    <div className="mx-auto max-w-4xl rounded-3xl bg-slate-900 px-6 py-14 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-white">Ready to get your time back?</h2>
                        <p className="mx-auto mt-3 max-w-xl text-slate-400">Set up takes a few minutes per platform, and the guides walk you through every click.</p>
                        <Link href={route('register')} className="btn-primary mt-8 !px-6 !py-3 text-base">
                            Get started free
                        </Link>
                    </div>
                </section>
            )}

            <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
                © {new Date().getFullYear()} Just One Post. Your tokens are stored encrypted and you can delete your account at any time.
            </footer>
        </div>
    );
}
