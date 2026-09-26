"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function ExperienceBanner() {
  return (
    <section className="mx-auto mb-20 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-20">
        <div className="relative aspect-[5/4] overflow-hidden rounded-xl">
          <Image src="/2211-lillie-ave/hero.jpg" alt="A welcoming space to settle into at Bunks" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>
        <div className="max-w-lg py-4">
          <p className="eyebrow mb-5 text-gray-500">Stay a little closer</p>
          <h2 className="editorial-title mb-6 text-4xl sm:text-5xl">Beautiful homes.<br />A human welcome.</h2>
          <p className="mb-8 text-gray-600 leading-relaxed">The best trips have a way of making you feel like you belong. We bring together homes with character and people who know them, so you can settle in and enjoy being there.</p>
          <Link href="/?view=about" className="inline-flex min-h-12 items-center gap-4 rounded-full border border-gray-300 px-6 text-sm font-medium transition-colors hover:bg-gray-100">Get to know Bunks <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
