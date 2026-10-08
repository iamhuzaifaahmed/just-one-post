const STYLES = {
    scheduled: ['bg-sky-50 text-sky-700 ring-sky-200', 'bg-sky-500'],
    queued: ['bg-indigo-50 text-indigo-700 ring-indigo-200', 'bg-indigo-500'],
    publishing: ['bg-amber-50 text-amber-700 ring-amber-200', 'bg-amber-500 animate-pulse'],
    published: ['bg-emerald-50 text-emerald-700 ring-emerald-200', 'bg-emerald-500'],
    failed: ['bg-red-50 text-red-700 ring-red-200', 'bg-red-500'],
    cancelled: ['bg-slate-100 text-slate-600 ring-slate-200', 'bg-slate-400'],
    partial: ['bg-amber-50 text-amber-700 ring-amber-200', 'bg-amber-500'],
    ok: ['bg-emerald-50 text-emerald-700 ring-emerald-200', 'bg-emerald-500'],
    expiring: ['bg-amber-50 text-amber-700 ring-amber-200', 'bg-amber-500'],
    expired: ['bg-red-50 text-red-700 ring-red-200', 'bg-red-500'],
    needs_reconnect: ['bg-red-50 text-red-700 ring-red-200', 'bg-red-500'],
};

const LABELS = { needs_reconnect: 'Needs reconnect', ok: 'Connected', partial: 'Partially published' };

export default function StatusBadge({ status, children, className = '' }) {
    const [tone, dot] = STYLES[status] || ['bg-slate-100 text-slate-700 ring-slate-200', 'bg-slate-400'];
    const label = children || LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone} ${className}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}
