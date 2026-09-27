import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Wifi, ShieldCheck, FileText } from "lucide-react";
import { fetchMarketingProperties } from "@/lib/marketingProperties";
import {
  WifiConnectForm,
  type WifiTheme,
} from "@/components/wifi/WifiConnectForm";

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
    page: "bg-gray-50 text-gray-900",
    imageOpacity: "opacity-60",
    overlay: "bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent",
    card: "bg-white/90 border-gray-200 shadow-sm",
    accent: "text-gray-900",
    title: "text-gray-900",
    subtitle: "text-gray-600",
    divider: "border-gray-200",
    link: "text-gray-900 hover:text-gray-600",
    footer: "text-gray-500",
    empty: "text-gray-500",
  },
  dark: {
    page: "bg-black text-white",
    imageOpacity: "opacity-40",
    overlay: "bg-gradient-to-t from-black via-black/80 to-transparent",
    card: "bg-gray-900/90 border-white/10 shadow-2xl",
    accent: "text-emerald-400",
    title: "text-white",
    subtitle: "text-gray-400",
    divider: "border-white/10",
    link: "text-emerald-400 hover:text-emerald-300",
    footer: "text-gray-500",
    empty: "text-gray-500",
  },
} satisfies Record<WifiTheme, Record<string, string>>;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const properties = await fetchMarketingProperties();
  const property = properties.find((p) => p.slug === slug);

  if (!property) return { title: "Connect to Wi-Fi" };

  return {
    title: `Connect to ${property.name} Wi-Fi`,
    description: "Secure guest Wi-Fi access.",
  };
}

export default async function WifiConnectPage({
  params,
  searchParams,
}: PageProps) {
  const { slug: rawSlug } = await params;
  const theme: WifiTheme =
    (await searchParams).theme === "dark" ? "dark" : "light";
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
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${t.page}`}
      >
        <section className="max-w-md text-center">
          <Wifi className="mx-auto mb-6 h-10 w-10" strokeWidth={1.25} />
          <h1 className="page-title mb-5">A little help getting connected.</h1>
          <p className={`mb-8 leading-relaxed ${t.empty}`}>
            Wi-Fi details aren’t available here yet. Check your arrival guide or
            contact your host.
          </p>
          <Link href="/my-trips" className="marketing-button">
            Find your stay
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${t.page} flex flex-col relative overflow-hidden`}
    >
      {/* Background Image */}
      <div className={`absolute inset-0 z-0 ${t.imageOpacity}`}>
        <img
          src={property.image}
          alt={property.name}
          className="w-full h-full object-cover "
        />
        <div className={`absolute inset-0 ${t.overlay}`} />
      </div>

      <main className="relative z-10 flex-grow flex flex-col justify-end p-6 pb-12 sm:justify-center sm:items-center">
        <div
          className={`sm:max-w-md w-full backdrop-blur-xl border p-8 rounded-xl ${t.card}`}
        >
          <div className={`flex items-center gap-3 mb-6 ${t.accent}`}>
            <Wifi className="w-6 h-6 " />
            <span className="text-sm font-medium tracking-wide uppercase">
              Secure Connection
            </span>
          </div>

          <h1 className={`marketing-title text-3xl mb-4 ${t.title}`}>
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
                <span className="underline underline-offset-4">
                  Download Welcome Guide
                </span>
              </a>
            </div>
          )}

          <div
            className={`mt-6 flex items-center justify-center gap-2 text-xs ${t.footer}`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Secure Wi-Fi</span>
          </div>
        </div>
      </main>
    </div>
  );
}
