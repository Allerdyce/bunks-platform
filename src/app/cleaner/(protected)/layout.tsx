
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { verifyCleanerSessionToken, CLEANER_SESSION_COOKIE } from '@/lib/cleanerAuth';

export const metadata: Metadata = {
    title: 'Bunks Cleaner Portal',
    description: 'Housekeeping guides and checklists',
    robots: 'noindex, nofollow',
};

import Image from 'next/image';
import { LogoutButton } from '@/components/cleaner/LogoutButton';

// ... (keep exports)

export default async function CleanerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get(CLEANER_SESSION_COOKIE)?.value;
    const session = verifyCleanerSessionToken(token);

    if (!session) {
        redirect("/cleaner/login");
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Mobile Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
                <Link href="/cleaner" className="flex items-center gap-2">
                    <Image
                        src="/bunks-logo.svg"
                        alt="Bunks"
                        width={80}
                        height={24}
                        className="h-6 w-auto"
                    />
                    <span className="text-sm font-medium text-slate-500 border-l border-slate-300 pl-3 ml-1">
                        Housekeeping
                    </span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-500 hidden sm:block">
                        {session.email}
                    </div>
                    <LogoutButton />
                </div>
            </header>
            <main className="p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
