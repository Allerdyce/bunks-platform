import { Suspense } from "react";
import { BunksApp } from "@/components/BunksApp";
import { fetchMarketingProperties } from "@/lib/marketingProperties";

export default async function TripGuidePage() {
    const properties = await fetchMarketingProperties();

    return (
        <Suspense fallback={null}>
            <BunksApp properties={properties} />
        </Suspense>
    );
}
