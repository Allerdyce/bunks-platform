"use client";

import Image from "next/image";
import { Button } from "@/components/shared/Button";
import type { NavigateHandler } from "@/types";

interface HomeCtaBannerProps {
  onNavigate: NavigateHandler;
}

export function HomeCtaBanner({ onNavigate }: HomeCtaBannerProps) {
  return (
    <section className="px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <Image
            src="/steamboat-pictures/exterior/exterior-4.jpg"
            alt="Snowy mountain home"
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/30" />
          <div className="relative z-10 p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center gap-8 text-white">
            <div className="flex-1 space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Partner with bunks</p>
              <h3 className="text-3xl sm:text-4xl font-serif leading-tight">
                Make your home
                <span className="block mt-2 text-4xl sm:text-5xl">
                  <span className="inline-flex items-center gap-4 bg-white/10 px-4 py-2 rounded-full">
                    <Image src="/icon-2.svg" alt="At symbol" width={36} height={36} className="h-9 w-9" />
                    bunks.
                  </span>
                </span>
              </h3>
              <p className="text-base text-white/80 max-w-2xl">
                We partner with thoughtful homeowners to transform beautiful properties into unforgettable stays.
                Let&apos;s make your space the next destination on the coast.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button variant="outline" onClick={() => onNavigate("about")} className="w-full sm:w-auto">
                Learn more
              </Button>
              <Button
                variant="secondary"
                onClick={() => onNavigate("listings")}
                className="bg-white/90 text-gray-900 hover:bg-white"
              >
                Explore stays
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
