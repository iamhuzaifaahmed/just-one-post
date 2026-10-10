import Brand from '@/Components/Brand';
import Icon from '@/Components/Icon';
import ThemeToggle from '@/Components/ThemeToggle';
import Toast from '@/Components/Toast';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const NAV = [
    { label: 'Dashboard', icon: 'home', href: () => route('dashboard'), active: () => route().current('dashboard') },
    { label: 'New post', icon: 'plus', href: () => route('posts.create'), active: () => route().current('posts.create') },
    {
        label: 'Posts',
        icon: 'posts',
        href: () => route('posts.index'),
        active: () => route().current('posts.*') && !route().current('posts.create'),
    },
    { label: 'Connections', icon: 'link', href: () => route('connections.index'), active: () => route().current('connections.*') },
    { label: 'Setup guide', icon: 'book', href: () => route('guide'), active: () => route().current('guide') },
    { label: 'Settings', icon: 'settings', href: () => route('settings.index'), active: () => route().current('settings.*') },
];

const ADMIN_NAV = [
    { label: 'Overview', icon: 'shield', href: () => route('admin.dashboard'), active: () => route().current('admin.dashboard') },
    { label: 'Users', icon: 'users', href: () => route('admin.users.index'), active: () => route().current('admin.users.*') },
    { label: 'App settings', icon: 'settings', href: () => route('admin.settings.index'), active: () => route().current('admin.settings.*') },
];

function NavItem({ item, onClick }) {
    const active = item.active();
    return (
        <Link
            href={item.href()}
            onClick={onClick}
            // Loaded in the background as soon as the menu appears and kept for a while, so the click
            // shows the page at once and refreshes it quietly afterwards (stale-while-revalidate).
            prefetch="mount"
            cacheFor={['30s', '5m']}
            className={
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ' +
                (active ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-soft hover:text-fg')
            }
        >
            <Icon name={item.icon} className={'size-5 ' + (active ? 'text-brand' : 'text-muted group-hover:text-fg')} />
            {item.label}
        </Link>
    );
}

function Sidebar({ user, onNavigate }) {
    return (
        <div className="flex h-full flex-col border-r border-line bg-panel px-4 py-5">
            <Link href={route('dashboard')} className="px-2" onClick={onNavigate}>
                <Brand />
            </Link>

            <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
                {NAV.map((item) => (
                    <NavItem key={item.label} item={item} onClick={onNavigate} />
                ))}

                {user.is_admin && (
                    <>
                        <div className="eyebrow px-3 pb-1 pt-6 !text-muted before:!bg-muted/60">Admin</div>
                        {ADMIN_NAV.map((item) => (
                            <NavItem key={item.label} item={item} onClick={onNavigate} />
                        ))}
                    </>
                )}
            </nav>

            <div className="mt-4 rounded-2xl border border-line bg-soft p-3">
                <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg">
                        {user.name?.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-fg">{user.name}</div>
                        <div className="truncate text-xs text-muted">{user.email}</div>
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <Link
                        href={route('profile.edit')}
                        onClick={onNavigate}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-panel py-1.5 text-xs font-medium text-fg hover:bg-canvas"
                    >
                        <Icon name="user" className="size-3.5" /> Profile
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-panel py-1.5 text-xs font-medium text-fg hover:bg-canvas"
                    >
                        <Icon name="logout" className="size-3.5" /> Log out
                    </Link>
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <span className="eyebrow !tracking-[0.16em] !text-muted before:!hidden">Theme</span>
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
}

export default function AuthenticatedLayout({ header, children }) {
    const page = usePage();
    const { auth, flash, impersonating } = page.props;
    const url = page.url;
    const [open, setOpen] = useState(false);

    useEffect(() => setOpen(false), [url]);

    return (
        <div className="min-h-screen bg-soft">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
                <Sidebar user={auth.user} />
            </aside>

            {/* Mobile top bar + drawer */}
            <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-panel/90 px-4 py-3 backdrop-blur lg:hidden">
                <Link href={route('dashboard')}>
                    <Brand />
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button onClick={() => setOpen(true)} className="rounded-lg border border-line p-2 text-fg hover:bg-soft" aria-label="Open menu">
                        <Icon name="menu" className="size-5" />
                    </button>
                </div>
            </div>
            {open && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
                    <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-2xl">
                        <Sidebar user={auth.user} onNavigate={() => setOpen(false)} />
                    </div>
                </div>
            )}

            {flash?.success && <Toast key={`s-${url}-${flash.success}`} type="success" message={flash.success} />}
            {flash?.error && <Toast key={`e-${url}-${flash.error}`} type="error" message={flash.error} />}

            {impersonating && (
                <div className="sticky top-0 z-40 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 lg:ml-64">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
                        <span>
                            Signed in as <strong>{impersonating.name}</strong> ({impersonating.email}). Everything you do is done as this user.
                        </span>
                        <Link href={route('impersonate.stop')} method="post" as="button" className="rounded-lg bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-amber-900">
                            Return to admin
                        </Link>
                    </div>
                </div>
            )}

            <main className="relative min-w-0 lg:pl-64">
                {/* Soft brand glow behind the page header, as on techloit.com */}
                <div className="glow pointer-events-none absolute inset-x-0 top-0 h-72 opacity-70" aria-hidden="true" />
                <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    {header}
                    {children}
                </div>
            </main>
        </div>
    );
}
