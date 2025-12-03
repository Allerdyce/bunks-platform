"use client";

/* eslint-disable react/no-unescaped-entities */

import Image from "next/image";
import type { NavigateHandler } from "@/types";
import { Button } from "@/components/shared/Button";

interface AboutViewProps {
  onNavigate: NavigateHandler;
}

export function AboutView({ onNavigate }: AboutViewProps) {
  return (
    <div className="animate-fade-in">
      <div className="grid lg:grid-cols-2 min-h-[80vh]">
        <div className="bg-stone-900 text-white flex items-center justify-center p-12 lg:p-24">
          <div className="max-w-xl">
            <h1 className="font-serif text-5xl sm:text-7xl mb-8 leading-tight">
              Less platform.
              <br />
              <span className="text-stone-400">More hospitality.</span>
            </h1>
            <p className="text-xl text-stone-300 font-light leading-relaxed mb-12">
              We stripped away the algorithms and the upsell noise. What’s left is a simple, honest way to stay somewhere special.
            </p>
            <Button
              variant="outline"
              className="border-stone-500 text-white hover:bg-white/10 mb-12"
              onClick={() => onNavigate("home")}
            >
              View Collection
            </Button>
            <div className="flex gap-8">
              <div>
                <div className="text-3xl font-serif mb-1">2</div>
                <div className="text-sm text-stone-500 uppercase tracking-widest">Properties</div>
              </div>
              <div>
                <div className="text-3xl font-serif mb-1">100%</div>
                <div className="text-sm text-stone-500 uppercase tracking-widest">Direct</div>
              </div>
              <div>
                <div className="text-3xl font-serif mb-1">0</div>
                <div className="text-sm text-stone-500 uppercase tracking-widest">Middlemen</div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative h-[50vh] lg:h-auto">
          <Image
            src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=2000"
            alt="Interior Detail"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        <section className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-4">
            <h2 className="font-serif text-3xl text-gray-900 sticky top-32">The Origin</h2>
          </div>
          <div className="md:col-span-8 text-lg text-gray-600 leading-relaxed space-y-6">
            <p>
              After years of traveling the world and hosting guests across California and Colorado, we realized something was missing from modern short-term rentals: a way to book beautiful homes directly with the people who care for them, without the noise, fees, and friction of big platforms.
            </p>
            <p>
              So we built Bunks — a boutique direct-booking platform that brings together the best of both worlds: hand-picked homes in inspiring locations, transparent pricing with no inflated fees, and a design-forward booking experience that’s calm, clean, and intuitive.
            </p>
          </div>
        </section>

        <section>
          <div className="bg-stone-50 rounded-3xl p-8 sm:p-16">
            <h2 className="font-serif text-3xl text-gray-900 mb-12 text-center">Why Direct Matters</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Fair Pricing",
                  desc: "No 15% service fees. No hidden booking costs. Your money goes to the stay, not the software.",
                },
                {
                  title: "Priority Access",
                  desc: "Our direct guests get first access to holiday dates and exclusive seasonal offers.",
                },
                {
                  title: "Real Connection",
                  desc: "You're booking with us, the owners. We know the homes inside and out.",
                },
              ].map((value) => (
                <div key={value.title} className="bg-white p-8 rounded-xl shadow-sm">
                  <h3 className="font-serif text-xl text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="text-center max-w-2xl mx-auto">
          <h3 className="font-serif text-2xl text-gray-900 mb-6">
            "We care about details. We care about thoughtful spaces. We care about hospitality that feels human."
          </h3>
          <p className="text-gray-500 italic">— The Bunks Team</p>
        </section>
      </div>
    </div>
  );
}
