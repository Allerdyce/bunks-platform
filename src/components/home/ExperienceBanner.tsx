"use client";

import Link from "next/link";
import { CalendarCheck2, MessageCircleHeart, Sparkles } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: CalendarCheck2,
    title: "Hand-picked local recommendations",
    description: "Our guidebooks share the restaurants, trails, and hidden gems we actually love near each home.",
  },
  {
    icon: MessageCircleHeart,
    title: "Local hosts who know the area",
    description: "Questions before or during your stay? Email us and a real person on our team will get back to you.",
  },
  {
    icon: Sparkles,
    title: "Verified comfort",
    description: "Professional housekeeping between every stay and self check-in with a smart lock.",
  },
];

const STATS = [
  { label: "Book direct", value: "Save 10%" },
  { label: "Hosted by", value: "Local hosts" },
  { label: "Guidebooks", value: "Hand-picked picks" },
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
              We obsess over every touchpoint—so your group arrives to a thoughtfully prepared home, with local
              recommendations from hosts who know the area and a real team to email whenever you need a hand.
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
                Email us
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
