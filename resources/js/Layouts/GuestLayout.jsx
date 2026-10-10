import Brand from '@/Components/Brand';
import PlatformIcon from '@/Components/PlatformIcon';
import ThemeToggle from '@/Components/ThemeToggle';
import { Link } from '@inertiajs/react';

const PLATFORMS = ['linkedin', 'facebook', 'instagram', 'youtube', 'threads', 'x', 'telegram', 'discord', 'wordpress'];

/** Login, register and password pages: a centred panel on the grid + glow background. */
export default function GuestLayout({ children }) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-canvas">
            <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="glow pointer-events-none absolute inset-x-0 top-0 h-[28rem]" aria-hidden="true" />

            <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
                <Link href="/" aria-label="Home">
                    <Brand />
                </Link>
                <ThemeToggle />
            </header>

            <main className="relative flex flex-1 items-center justify-center px-5 pb-12">
                <div className="w-full max-w-md">
                    <div className="card p-6 sm:p-8">{children}</div>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                        {PLATFORMS.map((p) => (
                            <PlatformIcon key={p} platform={p} size="sm" className="opacity-80" />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
