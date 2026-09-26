"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/shared/Button";

export function HomeHero({ onExplore }: { onExplore: () => void }) {
  return (
    <section className="mx-auto mb-16 max-w-7xl px-4 sm:px-6 lg:mb-24 lg:px-8">
      <div className="grid overflow-hidden rounded-xl bg-[#e9e9df] lg:min-h-[580px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col items-start justify-center px-7 py-12 sm:px-12 sm:py-16 lg:px-14">
          <p className="eyebrow mb-7 text-gray-600">Good places. Better together.</p>
          <h1 className="editorial-title mb-6 text-5xl sm:text-6xl lg:text-[4.5rem]">Somewhere<br />you can<br /><em className="font-normal">feel at home.</em></h1>
          <p className="mb-8 max-w-sm text-base leading-relaxed text-gray-600">Thoughtfully chosen homes. A little local knowledge. More time with your favorite people.</p>
          <Button onClick={onExplore}>Find your next stay <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Button>
          <p className="mt-5 text-xs text-gray-600">Book directly with Bunks and save 10%.</p>
        </div>
        <div className="relative min-h-[320px] sm:min-h-[440px]">
          <Image src="/2211-lillie-ave/hero.jpg" alt="A sunlit Bunks home in Summerland, California" fill sizes="(max-width: 1024px) 100vw, 55vw" priority className="object-cover" />
          <div className="absolute bottom-5 left-5 rounded-full bg-white/95 px-4 py-2 text-xs text-gray-900">Summerland, California</div>
        </div>
      </div>
    </section>
  );
}
