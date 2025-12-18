import { Suspense } from "react";
import { BunksApp } from "@/components/BunksApp";
import { fetchMarketingProperties } from "@/lib/marketingProperties";

// Update static cache every 5 minutes
export const revalidate = 300;

export default async function Page() {
  const properties = await fetchMarketingProperties();

  return (
    <Suspense fallback={null}>
      <BunksApp properties={properties} />
    </Suspense>
  );
}
