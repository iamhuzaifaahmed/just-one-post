const STYLES = {
    scheduled: ['bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/30', 'bg-sky-500'],
    queued: ['bg-brand/10 text-brand ring-brand/30', 'bg-brand'],
    publishing: ['bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30', 'bg-amber-500 animate-pulse'],
    published: ['bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30', 'bg-emerald-500'],
    failed: ['bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/30', 'bg-red-500'],
    cancelled: ['bg-soft text-muted ring-line', 'bg-slate-400'],
    partial: ['bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30', 'bg-amber-500'],
    ok: ['bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30', 'bg-emerald-500'],
    expiring: ['bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30', 'bg-amber-500'],
    expired: ['bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/30', 'bg-red-500'],
    needs_reconnect: ['bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/30', 'bg-red-500'],
};

const LABELS = { needs_reconnect: 'Needs reconnect', ok: 'Connected', partial: 'Partially published' };

export default function StatusBadge({ status, children, className = '' }) {
    const [tone, dot] = STYLES[status] || ['bg-soft text-fg/80 ring-line', 'bg-slate-400'];
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
