import Icon from '@/Components/Icon';
import PageHeader, { EmptyState } from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

function Pill({ tone, children }) {
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>{children}</span>;
}

export default function Users({ users, q }) {
    const [search, setSearch] = useState(q || '');

    const act = (method, name, u, text) => {
        if (text && !confirm(text)) return;
        router[method](route(name, u.id), method === 'post' ? {} : {}, { preserveScroll: true });
    };

    const submit = (e) => {
        e.preventDefault();
        router.get(route('admin.users.index'), search ? { q: search } : {}, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={<PageHeader title="Users" subtitle="Everyone who registered. Suspending blocks sign-in immediately; deleting removes all of their data." />}
        >
            <Head title="Users" />

            <form onSubmit={submit} className="mb-4 flex max-w-md gap-2">
                <div className="relative flex-1">
                    <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="input !ps-9" />
                </div>
                <button className="btn-secondary">Search</button>
                {q && (
                    <Link href={route('admin.users.index')} className="btn-ghost">
                        Clear
                    </Link>
                )}
            </form>

            {users.data.length === 0 ? (
                <EmptyState icon={<Icon name="users" />} title="No users found" />
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">User</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3 text-right">Accounts</th>
                                    <th className="px-3 py-3 text-right">Posts</th>
                                    <th className="px-3 py-3">Joined</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.data.map((u) => (
                                    <tr key={u.id} className={u.suspended ? 'bg-red-50/40' : ''}>
                                        <td className="px-5 py-3">
                                            <div className="font-medium text-slate-900">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {u.is_admin && <Pill tone="bg-indigo-50 text-indigo-700 ring-indigo-200">Admin</Pill>}
                                                {u.suspended && <Pill tone="bg-red-50 text-red-700 ring-red-200">Suspended</Pill>}
                                                {u.is_me && <Pill tone="bg-slate-100 text-slate-600 ring-slate-200">You</Pill>}
                                                {!u.is_admin && !u.suspended && <Pill tone="bg-emerald-50 text-emerald-700 ring-emerald-200">Active</Pill>}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-right tabular-nums">{u.accounts}</td>
                                        <td className="px-3 py-3 text-right tabular-nums">{u.posts}</td>
                                        <td className="whitespace-nowrap px-3 py-3 text-slate-500">{u.joined}</td>
                                        <td className="px-5 py-3">
                                            {!u.is_me && (
                                                <div className="flex flex-wrap justify-end gap-1.5">
                                                    {u.suspended ? (
                                                        <button onClick={() => act('post', 'admin.users.unsuspend', u)} className="btn-secondary btn-sm">
                                                            Unsuspend
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => act('post', 'admin.users.suspend', u, `Suspend ${u.email}? They are signed out immediately.`)}
                                                            className="btn-secondary btn-sm"
                                                        >
                                                            Suspend
                                                        </button>
                                                    )}
                                                    {!u.is_admin && !u.suspended && (
                                                        <button
                                                            onClick={() => act('post', 'admin.users.impersonate', u, `Sign in as ${u.email}? You will see and act as this user until you press "Return to admin".`)}
                                                            className="btn-secondary btn-sm"
                                                        >
                                                            Log in as
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => act('post', 'admin.users.admin', u, u.is_admin ? `Remove admin rights from ${u.email}?` : `Make ${u.email} an admin? They will see everything in this panel.`)}
                                                        className="btn-secondary btn-sm"
                                                    >
                                                        {u.is_admin ? 'Remove admin' : 'Make admin'}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            act('delete', 'admin.users.destroy', u, `Permanently delete ${u.email} and ALL of their accounts, posts and uploads? This cannot be undone.`)
                                                        }
                                                        className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                                                    >
                                                        <Icon name="trash" className="h-3.5 w-3.5" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {users.links.length > 3 && (
                <div className="mt-4 flex flex-wrap justify-center gap-1">
                    {users.links.map((l, i) => (
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
        </AuthenticatedLayout>
    );
}
