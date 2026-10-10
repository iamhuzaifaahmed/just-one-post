import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-brand bg-brand/10 text-brand focus:border-brand focus:bg-brand/15 focus:text-brand'
                    : 'border-transparent text-muted hover:border-line hover:bg-soft hover:text-fg focus:border-line focus:bg-soft focus:text-fg'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
