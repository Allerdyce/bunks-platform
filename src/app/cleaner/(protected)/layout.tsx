
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
                <Link href="/cleaner" className="font-serif text-lg text-slate-900 font-medium">
                    Bunks Housekeeping
                </Link>
                <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500 hidden sm:block">
                        {session.email}
                    </div>
                    {/* We can't use client-side handlers (onClick) in a Server Component layout easily without a client island.
                 For now, let's keep it simple or make a ClientHeader component.
                 Let's stick to a simple form action or just a link?
                 Actually, logout needs a POST usually, or client side JS.
                 Let's make a tiny client component for the UserMenu/Logout.
             */}
                </div>
            </header>
            <main className="p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
