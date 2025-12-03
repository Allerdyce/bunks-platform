"use client";

import { Coffee, ShieldCheck, Star } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Best Rate Guarantee",
    desc: "Save on service fees when you book directly with us.",
    accentBg: "bg-[#F3ECEC]",
    accentText: "text-[#B34747]",
  },
  {
    icon: Coffee,
    title: "Concierge Service",
    desc: "Local recommendations and support throughout your stay.",
    accentBg: "bg-[#E0F4EF]",
    accentText: "text-[#1F7A64]",
  },
  {
    icon: Star,
    title: "Quality Assured",
    desc: "Every property is professionally cleaned and inspected.",
    accentBg: "bg-[#E9F0FF]",
    accentText: "text-[#2A5CA8]",
  },
];

export function WhyBook() {
  return (
    <div className="bg-gray-50 py-24 rounded-3xl mb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl text-gray-900 mb-4">Why Book with Bunks?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            We bridge the gap between professional hospitality and the comfort of a home.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center">
              <div
                className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-white/60 ${feature.accentBg} ${feature.accentText}`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
