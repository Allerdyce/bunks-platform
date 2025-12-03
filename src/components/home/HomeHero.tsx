"use client";

import Image from "next/image";
import { Button } from "@/components/shared/Button";

interface HomeHeroProps {
  onExplore: () => void;
}

export function HomeHero({ onExplore }: HomeHeroProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
      <div className="relative h-[50vh] min-h-[400px] flex items-center justify-center bg-gray-900 rounded-3xl overflow-hidden">
        <Image
          src="/2211-lillie-ave/hero.jpg"
          alt="Luxury Interior"
          fill
          sizes="100vw"
          priority
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-serif text-4xl sm:text-6xl mb-6">
            Curated Stays.
            <br />
            Direct Booking.
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Experience boutique hospitality in our collection of unique homes. Book direct for the best rates and personalized service.
          </p>
          <Button
            onClick={onExplore}
            variant="secondary"
            className="mx-auto"
          >
            Explore Collection
          </Button>
        </div>
      </div>
    </div>
  );
}
