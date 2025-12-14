import { Suspense } from "react";
import { BunksApp } from "@/components/BunksApp";
import { fetchMarketingProperties } from "@/lib/marketingProperties";

export default async function TripEssentialPage() {
    const properties = await fetchMarketingProperties();

    return (
        <Suspense fallback={null}>
            <BunksApp properties={properties} />
        </Suspense>
    );
}
