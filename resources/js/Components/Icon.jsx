const PATHS = {
    home: (
        <>
            <path d="M3 11l9-8 9 8" />
            <path d="M5 10v10h5v-6h4v6h5V10" />
        </>
    ),
    plus: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
        </>
    ),
    posts: (
        <>
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M7 9h10M7 13h10M7 17h6" />
        </>
    ),
    link: (
        <>
            <path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1" />
            <path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" />
        </>
    ),
    settings: (
        <>
            <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
            <circle cx="15" cy="7" r="2" />
            <circle cx="9" cy="17" r="2" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    check: <path d="M5 13l4 4L19 7" />,
    checkCircle: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l3 3 5-6" />
        </>
    ),
    alert: (
        <>
            <path d="M12 3l10 18H2L12 3z" />
            <path d="M12 10v4M12 17.5h.01" />
        </>
    ),
    upload: (
        <>
            <path d="M12 16V4M7 9l5-5 5 5" />
            <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
        </>
    ),
    x: <path d="M6 6l12 12M18 6L6 18" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    logout: <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
    image: (
        <>
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="M21 16l-5-5-8 8" />
        </>
    ),
    video: (
        <>
            <rect x="3" y="6" width="13" height="12" rx="3" />
            <path d="M16 10l5-3v10l-5-3" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M3 10h18M8 3v4M16 3v4" />
        </>
    ),
    refresh: <path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" />,
    edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />,
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </>
    ),
    send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
    info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
        </>
    ),
    key: (
        <>
            <circle cx="8" cy="15" r="4" />
            <path d="M11 12l9-9M16 7l3 3" />
        </>
    ),
    globe: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </>
    ),
    book: (
        <>
            <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" />
            <path d="M4 19a2 2 0 012-2h13M9 7h6" />
        </>
    ),
    copy: (
        <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V6a2 2 0 012-2h9" />
        </>
    ),
    external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />,
    bulb: (
        <>
            <path d="M9 18h6M10 21h4" />
            <path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />
        </>
    ),
    ban: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M5.6 5.6l12.8 12.8" />
        </>
    ),
};

export default function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.8 }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {PATHS[name]}
        </svg>
    );
}
