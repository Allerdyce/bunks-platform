
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Bunks Cleaner Portal',
    description: 'Property resources and checklists for Bunks cleaners.',
    robots: 'noindex, nofollow',
};

// Start simple: no auth check *yet* on the layout, handled per page or middleware.
// But we should style this distinct from Admin.

export default function CleanerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-serif text-slate-900">Bunks</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold tracking-wide">
                            CLEANER
                        </span>
                    </div>
                    {/* Add user menu / logout later */}
                </div>
            </header>
            <main className="p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
