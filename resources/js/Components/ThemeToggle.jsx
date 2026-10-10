import Icon from '@/Components/Icon';
import { useEffect, useState } from 'react';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Sun / moon switch. The choice is saved in this browser; the first visit follows the system. */
export default function ThemeToggle({ className = '' }) {
    const [dark, setDark] = useState(() => (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false));

    useEffect(() => {
        // Keep several open tabs / the inline boot script in sync.
        const sync = () => setDark(document.documentElement.classList.contains('dark'));
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    const apply = (isDark) => {
        document.documentElement.classList.toggle('dark', isDark);
        try {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        } catch {
            /* private mode: the choice just is not remembered */
        }
        setDark(isDark);
    };

    const choose = (isDark, event) => {
        if (isDark === dark) return;

        if (reducedMotion()) {
            apply(isDark);
            return;
        }

        // Modern browsers: a circle grows from the button and reveals the new theme.
        if (document.startViewTransition) {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

            const transition = document.startViewTransition(() => apply(isDark));
            transition.ready
                .then(() => {
                    document.documentElement.animate(
                        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
                        { duration: 550, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
                    );
                })
                .catch(() => {});
            return;
        }

        // Other browsers: fade colours smoothly for a moment.
        const root = document.documentElement;
        root.classList.add('theme-fade');
        apply(isDark);
        setTimeout(() => root.classList.remove('theme-fade'), 450);
    };

    const item = (isDark, icon, label) => (
        <button
            type="button"
            onClick={(e) => choose(isDark, e)}
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
