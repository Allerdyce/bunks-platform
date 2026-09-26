"use client";

import { useState } from "react";
import type { Property } from "@/types";
import { HomeHero } from "./HomeHero";
import { PropertyGrid } from "./PropertyGrid";
import { WhyBook } from "./WhyBook";
import { ExperienceBanner } from "./ExperienceBanner";

interface HomeViewProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export function HomeView({ properties, onSelectProperty }: HomeViewProps) {
  const [destination, setDestination] = useState("All homes");
  const destinations = ["All homes", ...new Set(properties.map((property) => property.location))];
  const visibleProperties = destination === "All homes" ? properties : properties.filter((property) => property.location === destination);
  const scrollToListings = () => {
    const el = document.getElementById("listings");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="animate-fade-in">
      <HomeHero onExplore={scrollToListings} />
      <div id="listings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
          <div>
            <p className="eyebrow text-gray-500 mb-4">The Bunks collection</p>
            <h2 className="editorial-title text-4xl sm:text-5xl mb-3">Find a place that feels like you.</h2>
            <p className="text-gray-500">From slow mornings by the coast to weekends in the mountains.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter homes by destination">
          {destinations.map((item) => <button key={item} type="button" aria-pressed={destination === item} onClick={() => setDestination(item)} className={`min-h-11 rounded-full border px-5 py-2 text-sm transition-colors ${destination === item ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:border-gray-500"}`}>{item}</button>)}
        </div>
        <p className="sr-only" aria-live="polite">{visibleProperties.length} homes shown</p>
        <PropertyGrid properties={visibleProperties} onSelect={onSelectProperty} />
      </div>
      <WhyBook />
      <ExperienceBanner />
    </div>
  );
}
