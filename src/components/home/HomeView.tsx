"use client";

import { useState } from "react";
import type { Property } from "@/types";
import { HomeHero } from "./HomeHero";
import { PropertyGrid } from "./PropertyGrid";
import { WhyBook } from "./WhyBook";
import { ExperienceBanner } from "./ExperienceBanner";
import { GuestStories } from "./GuestStories";
import { StayFaq } from "./StayFaq";

interface HomeViewProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export function HomeView({ properties, onSelectProperty }: HomeViewProps) {
  const [destination, setDestination] = useState("All homes");
  const destinations = [
    "All homes",
    ...new Set(properties.map((property) => property.location)),
  ];
  const visibleProperties =
    destination === "All homes"
      ? properties
      : properties.filter((property) => property.location === destination);
  const scrollToListings = () => {
    const el = document.getElementById("listings");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-white">
      <HomeHero onExplore={scrollToListings} />
      <section id="listings" className="marketing-container py-16 sm:py-20">
        <div className="text-center mb-8">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide">
              Our collection
            </p>
            <h2 className="marketing-title text-3xl sm:text-[38px] mb-4">
              A place by the ocean. A home in the mountains.
            </h2>
            <p className="text-gray-500">
              From slow mornings by the coast to weekends in the mountains.
            </p>
          </div>
        </div>
        <div
          className="flex flex-wrap justify-center gap-2 mb-10"
          role="group"
          aria-label="Filter homes by destination"
        >
          {destinations.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={destination === item}
              onClick={() => setDestination(item)}
              className={`min-h-11 rounded-full border px-5 py-2 text-sm transition-colors ${destination === item ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:border-gray-500"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {visibleProperties.length}{" "}
          {visibleProperties.length === 1 ? "home" : "homes"} shown
        </p>
        <PropertyGrid
          properties={visibleProperties}
          onSelect={onSelectProperty}
        />
      </section>
      <WhyBook />
      <ExperienceBanner />
      <GuestStories />
      <StayFaq />
    </div>
  );
}
