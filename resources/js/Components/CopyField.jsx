import Icon from '@/Components/Icon';
import { useState } from 'react';

/** A read-only value with a Copy button (for redirect URIs, URLs, commands). */
export default function CopyField({ value, label }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            // Fallback for non-secure contexts
            const el = document.createElement('textarea');
            el.value = value;
            document.body.appendChild(el);
            el.select();
            try {
                document.execCommand('copy');
            } catch {
                /* ignore */
            }
            el.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
    };

    return (
        <div>
            {label && <div className="hint mb-1">{label}</div>}
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 ps-3 ring-1 ring-slate-200">
                <code className="min-w-0 flex-1 select-all break-all text-xs text-slate-800">{value}</code>
                <button type="button" onClick={copy} className="btn-secondary btn-sm shrink-0">
                    <Icon name={copied ? 'check' : 'copy'} className="h-3.5 w-3.5" />
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
        </div>
    );
}
