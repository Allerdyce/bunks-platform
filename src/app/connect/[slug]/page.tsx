
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Wifi, ShieldCheck, FileText } from "lucide-react";
import { fetchMarketingProperties } from "@/lib/marketingProperties";
import { WifiConnectForm, type WifiTheme } from "@/components/wifi/WifiConnectForm";

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
    searchParams: Promise<{ theme?: string }>;
}

const THEMES = {
    light: {
        page: "bg-stone-50 text-zinc-900",
        imageOpacity: "opacity-60",
        overlay: "bg-gradient-to-t from-stone-50 via-stone-50/80 to-transparent",
        card: "bg-white/90 border-zinc-200 shadow-xl",
        accent: "text-emerald-600",
        title: "text-zinc-900",
        subtitle: "text-zinc-600",
        divider: "border-zinc-200",
        link: "text-emerald-700 hover:text-emerald-600",
        footer: "text-zinc-500",
        empty: "text-zinc-500",
    },
    dark: {
        page: "bg-black text-white",
        imageOpacity: "opacity-40",
        overlay: "bg-gradient-to-t from-black via-black/80 to-transparent",
        card: "bg-zinc-900/90 border-white/10 shadow-2xl",
        accent: "text-emerald-400",
        title: "text-white",
        subtitle: "text-zinc-400",
        divider: "border-white/10",
        link: "text-emerald-400 hover:text-emerald-300",
        footer: "text-zinc-500",
        empty: "text-gray-500",
    },
} satisfies Record<WifiTheme, Record<string, string>>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const properties = await fetchMarketingProperties();
    const property = properties.find((p) => p.slug === slug);

    if (!property) return { title: "Connect to Wi-Fi" };

    return {
        title: `Connect to ${property.name} Wi-Fi`,
        description: "Secure guest Wi-Fi access.",
    };
}

export default async function WifiConnectPage({ params, searchParams }: PageProps) {
    const { slug: rawSlug } = await params;
    const theme: WifiTheme = (await searchParams).theme === "dark" ? "dark" : "light";
    const t = THEMES[theme];

    const ALIAS_MAP: Record<string, string> = {
        steamboat: "steamboat-downtown-townhome",
        summerland: "summerland-ocean-view-beach-bungalow",
        "2211lillie": "summerland-ocean-view-beach-bungalow",
    };

    const slug = ALIAS_MAP[rawSlug] || rawSlug;

    // Guide shown on the page, and the one linked from the success screen after unlocking.
    const GUIDES: Record<string, { page: string; success: string }> = {
        "steamboat-downtown-townhome": {
            page: "/Steamboat Welcome Guide.pdf",
            success: "/Steamboat Brochure.pdf",
        },
        "summerland-ocean-view-beach-bungalow": {
            page: "/Lillie Guidebook.pdf",
            success: "/Lillie Guidebook.pdf",
        },
    };
    const guide = GUIDES[slug];

    const properties = await fetchMarketingProperties();
    const property = properties.find((p) => p.slug === slug);

    if (!property) {
        notFound();
    }

    // Ensure we have wifi details
    if (!property.wifiSsid || !property.wifiPassword) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${t.page}`}>
                <p className={t.empty}>Wi-Fi details not available for this property.</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${t.page} flex flex-col relative overflow-hidden`}>
            {/* Background Image */}
            <div className={`absolute inset-0 z-0 ${t.imageOpacity}`}>
                <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-full object-cover blur-[2px]"
                />
                <div className={`absolute inset-0 ${t.overlay}`} />
            </div>

            <main className="relative z-10 flex-grow flex flex-col justify-end p-6 pb-12 sm:justify-center sm:items-center">
                <div className={`sm:max-w-md w-full backdrop-blur-xl border p-8 rounded-3xl ${t.card}`}>
                    <div className={`flex items-center gap-3 mb-6 ${t.accent}`}>
                        <Wifi className="w-6 h-6 animate-pulse" />
                        <span className="text-sm font-medium tracking-wide uppercase">Secure Connection</span>
                    </div>

                    <h1 className={`text-3xl font-serif mb-2 ${t.title}`}>
                        Welcome to {property.name}
                    </h1>
                    <p className={`mb-8 ${t.subtitle}`}>
                        Enter your email to get the Wi-Fi network and password.
                    </p>

                    <WifiConnectForm
                        ssid={property.wifiSsid}
                        password={property.wifiPassword}
                        propertySlug={property.slug}
                        guideUrl={guide?.success}
                        bookDirectUrl={`/property/${property.slug}`}
                        theme={theme}
                    />

                    {guide && (
                        <div className={`mt-8 pt-6 border-t text-center ${t.divider}`}>
                            <a
                                href={guide.page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-2 text-sm transition-colors ${t.link}`}
                            >
                                <FileText className="w-4 h-4" />
                                <span className="underline underline-offset-4">Download Welcome Guide</span>
                            </a>
                        </div>
                    )}

                    <div className={`mt-6 flex items-center justify-center gap-2 text-xs ${t.footer}`}>
                        <ShieldCheck className="w-3 h-3" />
                        <span>Secure Wi-Fi</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
