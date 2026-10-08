import Brand, { BrandMark } from '@/Components/Brand';
import PlatformIcon from '@/Components/PlatformIcon';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            {/* Brand panel */}
            <div className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
                <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/20 blur-3xl" />

                <Link href="/" className="relative">
                    <Brand dark />
                </Link>

                <div className="relative">
                    <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
                        Write once. <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">Publish everywhere.</span>
                    </h2>
                    <p className="mt-4 max-w-md text-slate-400">
                        Your own private scheduler for LinkedIn, Facebook, Instagram and YouTube. Pick the time and it posts itself.
                    </p>
                    <div className="mt-8 flex gap-3">
                        {['linkedin', 'facebook', 'instagram', 'youtube'].map((p) => (
                            <PlatformIcon key={p} platform={p} size="lg" />
                        ))}
                    </div>
                </div>

                <p className="relative text-xs text-slate-500">Self-hosted · single user · your data stays with you</p>
            </div>

            {/* Form panel */}
            <div className="flex flex-col items-center justify-center px-6 py-12">
                <Link href="/" className="mb-8 lg:hidden">
                    <BrandMark className="h-12 w-12" />
                </Link>
                <div className="w-full max-w-sm">{children}</div>
            </div>
        </div>
    );
}
