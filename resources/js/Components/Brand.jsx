import Icon from '@/Components/Icon';

export function BrandMark({ className = 'h-9 w-9' }) {
    return (
        <span
            className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30 ${className}`}
        >
            <Icon name="send" className="h-1/2 w-1/2" strokeWidth={2} />
        </span>
    );
}

export default function Brand({ dark = false }) {
    return (
        <span className="inline-flex items-center gap-3">
            <BrandMark />
            <span className={`text-lg font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                Just One Post
            </span>
        </span>
    );
}
