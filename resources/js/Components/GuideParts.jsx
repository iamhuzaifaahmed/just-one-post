import Icon from '@/Components/Icon';
import { Link } from '@inertiajs/react';
import { Children, cloneElement, createContext, useContext, useEffect, useState } from 'react';
import CopyField from '@/Components/CopyField';

export const LangContext = createContext('bn');

const STR = {
    en: {
        words: 'In simple words',
        tip: 'Tip',
        warn: 'Important',
        info: 'Good to know',
        danger: 'Do not',
        done: (a, b) => `${a} of ${b} done`,
        stepTip: 'Tip: click a numbered circle to tick a step off. Your ticks are saved in this browser.',
        copyThis: 'You copy this…',
        pasteHere: '…and paste it here (Settings)',
        markDone: 'Mark as done',
        markUndone: 'Mark as not done',
        redirectFor: (w) => `Your Redirect URI for ${w}`,
        redirectNote:
            'Copy it exactly as it is: no extra spaces, no slash at the end. If you later move this tool to a real website, you will add the new address too (see “Put it on your website”).',
        settings: 'Settings',
        connections: 'Connections',
    },
    bn: {
        words: 'সহজ ভাষায়',
        tip: 'টিপস',
        warn: 'গুরুত্বপূর্ণ',
        info: 'জেনে রাখুন',
        danger: 'এটা করবেন না',
        done: (a, b) => `${b}টির মধ্যে ${a}টি শেষ`,
        stepTip: 'টিপস: কোনো ধাপ শেষ হলে নম্বরের গোল বোতামে ক্লিক করে টিক দিন। আপনার টিক এই ব্রাউজারে সেভ থাকবে।',
        copyThis: 'আপনি এটি কপি করবেন…',
        pasteHere: '…এবং এখানে পেস্ট করবেন (Settings)',
        markDone: 'শেষ হয়েছে বলে টিক দিন',
        markUndone: 'টিক তুলে দিন',
        redirectFor: (w) => `${w}-এর জন্য আপনার Redirect URI`,
        redirectNote:
            'ঠিক যেমন আছে তেমনই কপি করুন: কোনো বাড়তি স্পেস নয়, শেষে স্ল্যাশ (/) নয়। পরে এই টুল আপনার আসল ওয়েবসাইটে নিলে নতুন ঠিকানাটাও যোগ করতে হবে (“ওয়েবসাইটে চালু করুন” ট্যাব দেখুন)।',
        settings: 'Settings',
        connections: 'Connections',
    },
};

export const useT = () => STR[useContext(LangContext)];

export const GoSettings = ({ children }) => {
    const t = useT();
    return (
        <Link href={route('settings.index')} className="font-medium text-indigo-600 underline underline-offset-2">
            {children || t.settings}
        </Link>
    );
};
export const GoConnections = ({ children }) => {
    const t = useT();
    return (
        <Link href={route('connections.index')} className="font-medium text-indigo-600 underline underline-offset-2">
            {children || t.connections}
        </Link>
    );
};

export function Section({ title, subtitle, children }) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

export function RedirectBox({ value, what }) {
    const t = useT();
    return (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
            <div className="mb-2 text-sm font-semibold text-indigo-900">{t.redirectFor(what)}</div>
            <CopyField value={value} />
            <p className="mt-2 text-xs text-indigo-800/80">{t.redirectNote}</p>
        </div>
    );
}

/** A button / menu name as it appears on screen, e.g. <UI>Create app</UI> */
export const UI = ({ children }) => (
    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.85em] font-semibold text-slate-800 ring-1 ring-inset ring-slate-200 [box-decoration-break:clone]">
        {children}
    </span>
);

/** Something to type or paste */
export const Val = ({ children }) => (
    <code className="break-all rounded bg-indigo-50 px-1.5 py-0.5 text-[0.85em] font-medium text-indigo-800">{children}</code>
);

export function Ext({ href, children }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-500"
        >
            {children}
            <Icon name="external" className="h-3.5 w-3.5" />
        </a>
    );
}

const CALLOUT = {
    tip: ['border-emerald-200 bg-emerald-50 text-emerald-900', 'bulb', 'text-emerald-600', 'Tip'],
    warn: ['border-amber-200 bg-amber-50 text-amber-900', 'alert', 'text-amber-600', 'Important'],
    info: ['border-sky-200 bg-sky-50 text-sky-900', 'info', 'text-sky-600', 'Good to know'],
    danger: ['border-red-200 bg-red-50 text-red-900', 'ban', 'text-red-600', 'Do not'],
};

export function Callout({ type = 'info', title, children }) {
    const [tone, icon, iconTone] = CALLOUT[type];
    const t = useT();
    return (
        <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${tone}`}>
            <Icon name={icon} className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} />
            <div className="min-w-0">
                <div className="font-semibold">{title || t[type]}</div>
                <div className="mt-0.5 space-y-2">{children}</div>
            </div>
        </div>
    );
}

/** Plain-English definition box */
export function Words({ children }) {
    return (
        <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 ring-1 ring-slate-200">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{useT().words}</div>
            {children}
        </div>
    );
}

export function Step({ n, done, onToggle, title, children }) {
    const t = useT();
    return (
        <li className="group/step relative flex gap-4 pb-8 last:pb-0">
            <span className="absolute left-[15px] top-9 bottom-0 w-px bg-slate-200 group-last/step:hidden" aria-hidden />
            <button
                type="button"
                onClick={onToggle}
                title={done ? t.markUndone : t.markDone}
                className={
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ' +
                    (done ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500')
                }
            >
                {done ? <Icon name="check" className="h-4 w-4" strokeWidth={3} /> : n}
            </button>
            <div className={'min-w-0 flex-1 ' + (done ? 'opacity-60' : '')}>
                <h3 className="pt-1 text-base font-semibold text-slate-900">{title}</h3>
                <div className="mt-2 space-y-3 text-sm leading-relaxed text-slate-700">{children}</div>
            </div>
        </li>
    );
}

/** Numbers its <Step> children and remembers which ones the user ticked (in this browser). */
export function Steps({ group, children }) {
    const key = `jop-guide:${group}`;
    const [done, setDone] = useState([]);

    useEffect(() => {
        try {
            setDone(JSON.parse(localStorage.getItem(key) || '[]'));
        } catch {
            setDone([]);
        }
    }, [key]);

    const toggle = (i) => {
        setDone((prev) => {
            const next = prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i];
            try {
                localStorage.setItem(key, JSON.stringify(next));
            } catch {
                /* storage unavailable */
            }
            return next;
        });
    };

    const items = Children.toArray(children).filter(Boolean);
    const t = useT();
    const doneCount = done.filter((i) => i < items.length).length;
    return (
        <div>
            <div className="mb-5 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                        className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(doneCount / items.length) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-medium text-slate-500">
                    {t.done(doneCount, items.length)}
                </span>
            </div>
            <ol>
                {items.map((child, i) =>
                    cloneElement(child, { n: i + 1, done: done.includes(i), onToggle: () => toggle(i) }),
                )}
            </ol>
            <p className="mt-6 text-xs text-slate-400">{t.stepTip}</p>
        </div>
    );
}

/** "Copy this from X -> paste here in Settings" table */
export function PasteMap({ rows }) {
    const t = useT();
    return (
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-4 py-2.5">{t.copyThis}</th>
                        <th className="px-4 py-2.5">{t.pasteHere}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map(([from, to]) => (
                        <tr key={from}>
                            <td className="px-4 py-2.5 font-medium text-slate-800">{from}</td>
                            <td className="px-4 py-2.5 text-slate-600">{to}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function Faq({ items }) {
    return (
        <div className="divide-y divide-slate-100 rounded-xl bg-white ring-1 ring-slate-200">
            {items.map(([q, a]) => (
                <details key={q} className="group p-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-slate-900">
                        {q}
                        <span className="mt-0.5 text-slate-400 transition group-open:rotate-45">＋</span>
                    </summary>
                    <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">{a}</div>
                </details>
            ))}
        </div>
    );
}
