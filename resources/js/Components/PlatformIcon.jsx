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
    if (platform === 'telegram') {
        return (
            <span className={`${base} bg-[#229ED9]`}>
                <svg viewBox="0 0 24 24" className="h-3/5 w-3/5 fill-current">
                    <path d="M21.5 3.3 2.9 10.5c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.6.4.8.8.8.5 0 .7-.2 1-.5l2.3-2.3 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.600c.3-1.200-.5-1.800-1.300-1.400zM8.500 13l9.700-6.100c.5-.3.9-.1.5.2l-8.100 7.300-.3 3.300L8.500 13z" />
                </svg>
            </span>
        );
    }
    if (platform === 'discord') {
        return (
            <span className={`${base} bg-[#5865F2]`}>
                <svg viewBox="0 0 24 24" className="h-3/5 w-3/5">
                    <path
                        d="M5 7c2-1.500 4-2 7-2s5 .5 7 2c1.300 3 2 6 2 9-1.500 1.500-3.500 2.300-5.500 2.500l-1-1.500c-1.500.3-3.500.3-5 0l-1 1.500C6.500 18.300 4.500 17.500 3 16c0-3 .7-6 2-9z"
                        fill="currentColor"
                    />
                    <circle cx="9" cy="12.500" r="1.400" fill="#5865F2" />
                    <circle cx="15" cy="12.500" r="1.400" fill="#5865F2" />
                </svg>
            </span>
        );
    }
    if (platform === 'threads') {
        return <span className={`${base} bg-black`}>@</span>;
    }
    if (platform === 'x') {
        return (
            <span className={`${base} bg-black`}>
                <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round">
                    <path d="M5 4l14 16M19 4L5 20" />
                </svg>
            </span>
        );
    }
    if (platform === 'wordpress') {
        return <span className={`${base} bg-[#21759B]`}>W</span>;
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
