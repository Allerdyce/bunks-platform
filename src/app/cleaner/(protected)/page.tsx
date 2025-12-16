
import Link from 'next/link';
import Image from 'next/image';
import { CLEANING_PROFILES } from '@/lib/cleaning/data';
import { ResourceList } from '@/components/resources/ResourceList';

export default function CleanerDashboard() {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-slate-900">My Properties</h1>
                <p className="text-slate-500">Select a property to view cleaning guide.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {CLEANING_PROFILES.map((profile) => (
                    <Link
                        key={profile.slug}
                        href={`/cleaner/${profile.slug}`}
                        className="group block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                        <div className="aspect-[4/3] relative bg-slate-100">
                            <Image
                                src={profile.heroImage}
                                alt={profile.heroAlt}
                                fill
                                className="object-cover group-hover:scale-105 transition duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                            <div className="absolute bottom-3 left-4 text-white">
                                <h3 className="font-semibold text-lg">{profile.title}</h3>
                                <p className="text-sm opacity-90">{profile.locationLabel}</p>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex flex-wrap gap-2">
                                {profile.chips.slice(0, 2).map((chip) => (
                                    <span key={chip} className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                        {chip}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div>
                <ResourceList />
            </div>
        </div >
    );
}
