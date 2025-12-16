
import { notFound } from 'next/navigation';
import { CLEANING_PROFILES } from '@/lib/cleaning/data';
import { ChecklistViewer } from '@/components/resources/ChecklistViewer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Params {
    params: Promise<{ slug: string }>;
}

export default async function CleanerPropertyPage({ params }: Params) {
    const { slug } = await params;
    const profile = CLEANING_PROFILES.find((p) => p.slug === slug);

    if (!profile) {
        notFound();
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Link href="/cleaner" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>
            <ChecklistViewer profile={profile} />
        </div>
    );
}
