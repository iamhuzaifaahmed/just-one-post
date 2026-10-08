import Icon from '@/Components/Icon';
import { useEffect, useState } from 'react';

/** Auto-dismissing flash message. Re-mount (via key) to show a new one. */
export default function Toast({ type = 'success', message }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setVisible(false), type === 'error' ? 9000 : 4500);
        return () => clearTimeout(t);
    }, [type]);

    if (!visible || !message) return null;

    const error = type === 'error';

    return (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <div
                className={
                    'pointer-events-auto flex max-w-lg animate-slide-in items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ' +
                    (error
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800')
                }
                role="status"
            >
                <Icon name={error ? 'alert' : 'checkCircle'} className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="flex-1">{message}</span>
                <button onClick={() => setVisible(false)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
                    <Icon name="x" className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
