
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Wifi, ArrowRight, ShieldCheck } from "lucide-react";
import { fetchMarketingProperties } from "@/lib/marketingProperties";
import { WifiConnectForm } from "@/components/wifi/WifiConnectForm";

// 5 minute cache
export const revalidate = 300;

export async function generateStaticParams() {
    const properties = await fetchMarketingProperties();
    return properties.map((property) => ({
        slug: property.slug,
    }));
}

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const properties = await fetchMarketingProperties();
    const property = properties.find((p) => p.slug === slug);

    if (!property) return { title: "Connect to Wi-Fi" };

    return {
        title: `Connect to ${property.name} Wi-Fi`,
        description: "Secure, high-speed internet access.",
    };
}

export default async function WifiConnectPage({ params }: PageProps) {
    const { slug } = await params;
    const properties = await fetchMarketingProperties();
    const property = properties.find((p) => p.slug === slug);

    if (!property) {
        notFound();
    }

    // Ensure we have wifi details
    if (!property.wifiSsid || !property.wifiPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <p className="text-gray-500">Wi-Fi details not available for this property.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 opacity-40">
                <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-full object-cover blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            </div>

            <main className="relative z-10 flex-grow flex flex-col justify-end p-6 pb-12 sm:justify-center sm:items-center">
                <div className="sm:max-w-md w-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <div className="flex items-center gap-3 mb-6 text-emerald-400">
                        <Wifi className="w-6 h-6 animate-pulse" />
                        <span className="text-sm font-medium tracking-wide uppercase">Secure Connection</span>
                    </div>

                    <h1 className="text-3xl font-serif text-white mb-2">
                        Welcome to {property.name}
                    </h1>
                    <p className="text-zinc-400 mb-8">
                        Enter your email to unlock high-speed Wi-Fi access.
                    </p>

                    <WifiConnectForm
                        ssid={property.wifiSsid}
                        password={property.wifiPassword}
                        propertySlug={property.slug}
                    />

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Secure network • 1Gbps Fiber</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
