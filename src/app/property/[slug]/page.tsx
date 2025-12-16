import type { Metadata } from "next";
import { Suspense } from "react";
import { BunksApp } from "@/components/BunksApp";
import { fetchMarketingProperties } from "@/lib/marketingProperties";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
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
  const { slug } = await params;

  // Note: BunksApp (Client Component) handles the actual rendering and "selectedProperty" state.
  // We pass the properties array, but the specific selection happens via URL state in BunksApp.

  return (
    <Suspense fallback={null}>
      <BunksApp properties={properties} />
    </Suspense>
  );
}
