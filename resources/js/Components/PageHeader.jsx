export default function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-fg">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

export function EmptyState({ icon, title, children }) {
    return (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
            {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-muted">{icon}</div>}
            <div className="font-semibold text-fg">{title}</div>
            {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
        </div>
    );
}
