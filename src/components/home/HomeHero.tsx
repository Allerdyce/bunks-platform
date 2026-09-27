"use client";

import Image from "next/image";
import { Button } from "@/components/shared/Button";

export function HomeHero({ onExplore }: { onExplore: () => void }) {
  return (
    <>
      <section className="relative isolate flex min-h-[640px] items-center justify-center overflow-hidden bg-gray-900 px-6 pb-24 pt-40 text-center text-white sm:min-h-[720px] lg:min-h-[min(850px,92svh)]">
        <Image
          src="/2211-lillie-ave/kitchen/kitchen-1.webp"
          alt="A sunlit dining table opening onto the Pacific at our Summerland home"
          fill
          sizes="100vw"
          priority
          className="-z-20 object-cover object-[45%_55%]"
        />
        <div className="absolute inset-0 -z-10 bg-black/45" />
        <div className="mx-auto max-w-2xl">
          <p className="mb-6 text-sm font-medium text-white">
            Good stays deserve a return visit.
          </p>
          <h1 className="marketing-title text-[46px] sm:text-6xl lg:text-[68px]">
            Find your place.
            <br />
            Feel at home.
          </h1>
          <p className="mx-auto mb-8 mt-6 max-w-lg text-lg leading-relaxed text-white">
            Come back to a place you love.
            <br className="hidden sm:block" /> Beautiful homes, booked directly
            with your hosts.
          </p>
          <Button
            onClick={onExplore}
            variant="secondary"
            className="mx-auto border-white bg-white px-7 text-base text-gray-950 hover:bg-gray-100"
          >
            Explore our homes
          </Button>
        </div>
        <p className="absolute bottom-7 left-0 right-0 text-sm text-white/90">
          At home in Summerland, California
        </p>
      </section>
      <div className="flex min-h-16 w-full items-center justify-center gap-4 bg-[#f9e8a6] px-6 py-4 text-sm font-semibold text-gray-950 sm:text-base">
        A better way to stay. Book direct and save 10%.
      </div>
    </>
  );
}
