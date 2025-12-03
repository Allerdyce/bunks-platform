"use client";

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
  const scrollToListings = () => {
    const el = document.getElementById("listings");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="animate-fade-in">
      <HomeHero onExplore={scrollToListings} />
      <div id="listings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-serif text-3xl text-gray-900 mb-2">Our Collection</h2>
            <p className="text-gray-500">Hand-picked properties for discerning travelers.</p>
          </div>
        </div>
        <PropertyGrid properties={properties} onSelect={onSelectProperty} />
      </div>
      <WhyBook />
      <ExperienceBanner />
    </div>
  );
}
