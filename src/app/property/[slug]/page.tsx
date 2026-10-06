import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BunksApp } from "@/components/BunksApp";
import { fetchMarketingProperties } from "@/lib/marketingProperties";
import { getCanonicalSlugFromPath } from "@/lib/propertySlugs";

// Update static cache every 5 minutes
export const revalidate = 300;

// Pre-render all property paths at build time
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
  const slug = getCanonicalSlugFromPath((await params).slug);
  const properties = await fetchMarketingProperties();
  const property = properties.find((p) => p.slug === slug);

  if (!property) {
    return {
      title: "Property Not Found",
    };
  }

  return {
    title: property.name,
    description: property.description || `Stay at ${property.name} in ${property.location}.`,
    // The short path (/property/summerland) renders the same page; point search engines at one URL.
    alternates: { canonical: `/property/${property.slug}` },
    openGraph: {
      title: property.name,
      description: property.description || `Stay at ${property.name} in ${property.location}.`,
      images: [
        {
          url: property.image,
          width: 1200,
          height: 630,
          alt: property.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: property.name,
      description: property.description || `Stay at ${property.name} in ${property.location}.`,
      images: [property.image],
    },
  };
}

export default async function PropertyPage({ params }: PageProps) {
  // Pre-fetch properties to ensure cache is primed or available
  const properties = await fetchMarketingProperties();
  const slug = getCanonicalSlugFromPath((await params).slug);
  if (!properties.some((property) => property.slug === slug)) {
    notFound();
  }

  // Note: BunksApp (Client Component) handles the actual rendering and "selectedProperty" state.
  // We pass the properties array, but the specific selection happens via URL state in BunksApp.

  return (
    <Suspense fallback={null}>
      <BunksApp properties={properties} />
    </Suspense>
  );
}
