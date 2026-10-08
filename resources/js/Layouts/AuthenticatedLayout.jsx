import Brand from '@/Components/Brand';
import Icon from '@/Components/Icon';
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

function NavItem({ item, onClick }) {
    const active = item.active();
    return (
        <Link
            href={item.href()}
            onClick={onClick}
            className={
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ' +
                (active
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white')
            }
        >
            <Icon name={item.icon} className={'h-5 w-5 ' + (active ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300')} />
            {item.label}
        </Link>
    );
}

function Sidebar({ user, onNavigate }) {
    return (
        <div className="flex h-full flex-col bg-slate-900 px-4 py-5">
            <Link href={route('dashboard')} className="px-2" onClick={onNavigate}>
                <Brand dark />
            </Link>

            <nav className="mt-8 flex-1 space-y-1">
                {NAV.map((item) => (
                    <NavItem key={item.label} item={item} onClick={onNavigate} />
                ))}
            </nav>

            <div className="rounded-2xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400 text-sm font-bold text-white">
                        {user.name?.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white">{user.name}</div>
                        <div className="truncate text-xs text-slate-400">{user.email}</div>
                    </div>
                </div>
                <div className="mt-3 flex gap-2">
                    <Link
                        href={route('profile.edit')}
                        onClick={onNavigate}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
                    >
                        <Icon name="user" className="h-3.5 w-3.5" /> Profile
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
                    >
                        <Icon name="logout" className="h-3.5 w-3.5" /> Log out
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function AuthenticatedLayout({ header, children }) {
    const page = usePage();
    const { auth, flash } = page.props;
    const url = page.url;
    const [open, setOpen] = useState(false);

    useEffect(() => setOpen(false), [url]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
                <Sidebar user={auth.user} />
            </aside>

            {/* Mobile top bar + drawer */}
            <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
                <Brand />
                <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Open menu">
                    <Icon name="menu" />
                </button>
            </div>
            {open && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
                    <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-2xl">
                        <Sidebar user={auth.user} onNavigate={() => setOpen(false)} />
                    </div>
                </div>
            )}

            {flash?.success && <Toast key={`s-${url}-${flash.success}`} type="success" message={flash.success} />}
            {flash?.error && <Toast key={`e-${url}-${flash.error}`} type="error" message={flash.error} />}

            <main className="min-w-0 lg:pl-64">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    {header}
                    {children}
                </div>
            </main>
        </div>
    );
}
