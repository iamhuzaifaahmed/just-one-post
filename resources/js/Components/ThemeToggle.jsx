import Icon from '@/Components/Icon';
import { useEffect, useState } from 'react';

/** Sun / moon switch. The choice is saved in this browser; the first visit follows the system. */
export default function ThemeToggle({ className = '' }) {
    const [dark, setDark] = useState(() => (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false));

    useEffect(() => {
        // Keep several open tabs / the inline boot script in sync.
        const sync = () => setDark(document.documentElement.classList.contains('dark'));
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    const choose = (isDark) => {
        document.documentElement.classList.toggle('dark', isDark);
        try {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        } catch {
            /* private mode: the choice just is not remembered */
        }
        setDark(isDark);
    };

    const item = (isDark, icon, label) => (
        <button
            type="button"
            onClick={() => choose(isDark)}
            aria-label={label}
            aria-pressed={dark === isDark}
            className={
                'flex size-7 items-center justify-center rounded-full transition ' +
                (dark === isDark ? 'bg-brand text-brand-fg shadow-sm' : 'text-muted hover:text-fg')
            }
        >
            <Icon name={icon} className="size-4" />
        </button>
    );

    return (
        <div className={`inline-flex items-center gap-0.5 rounded-full border border-line bg-soft p-0.5 ${className}`} role="group" aria-label="Theme">
            {item(false, 'sun', 'Light mode')}
            {item(true, 'moon', 'Dark mode')}
        </div>
    );
}
