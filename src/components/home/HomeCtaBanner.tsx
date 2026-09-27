"use client";
import Image from "next/image";
import { Button } from "@/components/shared/Button";
import type { NavigateHandler } from "@/types";

export function HomeCtaBanner({ onNavigate }: { onNavigate: NavigateHandler }) {
  return (
    <section className="relative isolate flex min-h-[420px] items-center justify-center overflow-hidden px-6 py-20 text-center text-white">
      <Image
        src="/2211-lillie-ave/exterior/exterior-1.webp"
        alt="A quiet place to watch the ocean from Summerland"
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-black/50" />
      <div>
        <h2 className="marketing-title mb-7 text-4xl sm:text-6xl">
          Somewhere worth
          <br />
          coming back to.
        </h2>
        <Button
          variant="secondary"
          className="mx-auto bg-white text-base text-gray-950"
          onClick={() => onNavigate("listings")}
        >
          Find your stay
        </Button>
      </div>
    </section>
  );
}
