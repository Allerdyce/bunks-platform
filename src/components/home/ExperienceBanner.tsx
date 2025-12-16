"use client";

import Link from "next/link";
import { CalendarCheck2, MessageCircleHeart, Sparkles } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: CalendarCheck2,
    title: "Itineraries built for you",
    description: "Pre-stocked fridges, ski shuttles, and chef dinners arranged before you arrive.",
  },
  {
    icon: MessageCircleHeart,
    title: "Concierge on speed dial",
    description: "Real humans with local knowledge, replying in under five minutes day or night.",
  },
  {
    icon: Sparkles,
    title: "Verified comfort",
    description: "Designer-grade linens, pro housekeeping, and tech-enabled entry on every stay.",
  },
];

const STATS = [
  { label: "Avg. response time", value: "< 5 min" },
  { label: "Curated partners", value: "50+" },
  { label: "Guest rating", value: "4.9 / 5" },
];

export function ExperienceBanner() {
  return (
    <section className="relative mb-24 px-4">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-stone-200 bg-[#F3ECEC] px-6 py-14 sm:px-10 lg:px-14 text-stone-900 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              REPEAT AND TREAT
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-stone-900">
              White-glove hospitality with the soul of the mountains.
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl">
              We obsess over every touchpoint—so your group arrives to a home staged like your favorite boutique hotel, layered
              with concierge-level service, curated local rituals, and humans who reply when inspiration strikes at
              midnight.
            </p>

            <div className="flex flex-wrap gap-6">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[#E7DADA] bg-white px-5 py-4 text-stone-900 shadow-sm shadow-[#E7DADA]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{stat.label}</p>
                  <p className="text-2xl font-serif text-stone-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="#listings"
                className="inline-flex items-center justify-center rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5"
              >
                Explore the collection
              </Link>
              <a
                href="mailto:stay@bunks.com"
                className="inline-flex items-center justify-center rounded-full border border-stone-900 px-6 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-900/5"
              >
                Talk to our concierge
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {HIGHLIGHTS.map((highlight) => (
              <div
                key={highlight.title}
                className="group rounded-3xl border border-stone-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF5A5F]/10 text-[#FF5A5F]">
                  <highlight.icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-2xl mb-2 text-stone-900">{highlight.title}</h3>
                <p className="text-sm text-stone-500">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
