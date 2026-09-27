"use client";
import Image from "next/image";
import type { NavigateHandler } from "@/types";
import { Button } from "@/components/shared/Button";
import { WhyBook } from "@/components/home/WhyBook";
import { GuestStories } from "@/components/home/GuestStories";

export function AboutView({ onNavigate }: { onNavigate: NavigateHandler }) {
  return (
    <div className="bg-white">
      <section className="marketing-container pb-14 pt-12 text-center sm:pb-20 sm:pt-20">
        <p className="mb-6 text-sm font-semibold uppercase tracking-wide">
          A little about Bunks
        </p>
        <h1 className="marketing-title mx-auto max-w-4xl text-4xl sm:text-6xl">
          Good homes.
          <br />
          People who care.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-gray-600">
          We believe the best stays feel personal. A home with character, a host
          who knows it, and room to make memories of your own.
        </p>
      </section>
      <div className="marketing-container">
        <div className="relative h-[320px] overflow-hidden rounded-lg sm:h-[520px]">
          <Image
            src="/2211-lillie-ave/kitchen/kitchen-1.webp"
            alt="The Summerland dining room, with open doors to the ocean"
            fill
            sizes="100vw"
            priority
            className="object-cover object-[50%_60%]"
          />
        </div>
      </div>
      <section className="marketing-section">
        <div className="marketing-container grid gap-8 md:grid-cols-2 lg:gap-20">
          <h2 className="marketing-title max-w-md text-4xl sm:text-5xl">
            Hospitality begins
            <br />
            with a connection.
          </h2>
          <div className="max-w-xl space-y-5 text-lg leading-relaxed">
            <p>
              After years of traveling and hosting in California and Colorado,
              we wanted a simpler way to bring guests and homes together.
            </p>
            <p>
              So we built Bunks: a small collection of homes you can book
              directly with the people who care for them. From choosing a place
              to finding your favorite neighborhood coffee, we want the
              experience to feel welcoming and straightforward.
            </p>
            <p>Our homes are different. The care behind them is the same.</p>
          </div>
        </div>
      </section>
      <WhyBook showAboutLink={false} />
      <section className="marketing-container pb-20 sm:pb-28">
        <div className="grid overflow-hidden rounded-lg bg-[#eeece8] md:grid-cols-2">
          <div className="relative min-h-[360px] md:min-h-[550px]">
            <Image
              src="/2211-lillie-ave/living-room/living-room-4.webp"
              alt="A thoughtfully furnished living room at Bunks"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col items-start justify-center px-7 py-12 sm:p-12 lg:p-16">
            <p className="mb-6 text-sm font-semibold uppercase tracking-wide">
              From coast to mountains
            </p>
            <h2 className="marketing-title mb-6 text-4xl lg:text-5xl">
              A change of scenery.
              <br />
              The comforts of home.
            </h2>
            <p className="mb-8 text-lg leading-relaxed">
              Long lunches in Summerland. Fresh snow in Steamboat. Find the
              setting for your next chapter, and we’ll help you settle in.
            </p>
            <Button
              onClick={() => onNavigate("listings")}
              className="text-base"
            >
              Explore our homes
            </Button>
          </div>
        </div>
      </section>
      <GuestStories />
      <section className="marketing-section text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="marketing-title mb-6 text-4xl sm:text-5xl">
            Let’s make you feel at home.
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-gray-600">
            Have a question about a stay, or a home you’d like to share with
            Bunks? We’d love to hear from you.
          </p>
          <a href="mailto:stay@bunks.com" className="marketing-button">
            Get in touch
          </a>
        </div>
      </section>
    </div>
  );
}
