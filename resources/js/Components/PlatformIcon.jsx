const SIZES = {
    sm: 'h-6 w-6 rounded-md text-[10px]',
    md: 'h-9 w-9 rounded-lg text-sm',
    lg: 'h-12 w-12 rounded-xl text-lg',
};

export default function PlatformIcon({ platform, size = 'md', className = '' }) {
    const base = `inline-flex shrink-0 items-center justify-center font-bold text-white ${SIZES[size]} ${className}`;

    if (platform === 'linkedin') {
        return <span className={`${base} bg-linkedin`}>in</span>;
    }
    if (platform === 'facebook') {
        return <span className={`${base} bg-facebook`}>f</span>;
    }
    if (platform === 'youtube') {
        return (
            <span className={`${base} bg-youtube`}>
                <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 fill-current">
                    <path d="M8 5v14l11-7z" />
                </svg>
            </span>
        );
    }
    if (platform === 'instagram') {
        return (
            <span
                className={`${base}`}
                style={{ background: 'linear-gradient(45deg,#f9a825 0%,#e1306c 50%,#833ab4 100%)' }}
            >
                <svg viewBox="0 0 24 24" className="h-3/5 w-3/5" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
                </svg>
            </span>
        );
    }
    return <span className={`${base} bg-slate-400`}>?</span>;
}

/** Overlapping row of platform icons with a status ring per target. */
export function PlatformStack({ targets }) {
    const ring = {
        published: 'ring-emerald-400',
        failed: 'ring-red-400',
        cancelled: 'ring-slate-300 opacity-50',
        publishing: 'ring-amber-400',
        queued: 'ring-indigo-300',
        scheduled: 'ring-white',
    };

    return (
        <span className="inline-flex -space-x-1.5">
            {targets.map((t, i) => (
                <PlatformIcon
                    key={i}
                    platform={t.platform}
                    size="sm"
                    className={'ring-2 ' + (ring[t.status] || 'ring-white')}
                />
            ))}
        </span>
    );
}
