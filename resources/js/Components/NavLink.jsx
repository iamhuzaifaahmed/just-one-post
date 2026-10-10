import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-brand text-fg focus:border-brand'
                    : 'border-transparent text-muted hover:border-line hover:text-fg/80 focus:border-line focus:text-fg/80') +
                className
            }
        >
            {children}
        </Link>
    );
}
