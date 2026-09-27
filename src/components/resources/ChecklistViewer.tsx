"use client";

import Image from "next/image";
import { ChecklistProfile } from "@/types/cleaning";

interface ChecklistViewerProps {
  profile: ChecklistProfile;
}

export function ChecklistViewer({ profile }: ChecklistViewerProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="space-y-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-100">
          <Image
            src={profile.heroImage}
            alt={profile.heroAlt}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-3xl font-serif">{profile.title}</h1>
            <p className="opacity-90">{profile.locationLabel}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <p className="text-gray-600 leading-relaxed">{profile.summary}</p>
          <div className="flex flex-wrap gap-2">
            {profile.chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {profile.sections.map((section, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          >
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
              <span className="text-2xl">{section.badge}</span>
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
            </div>

            <div className="p-6 space-y-6">
              {section.description && (
                <p className="text-sm text-gray-500 italic">
                  {section.description}
                </p>
              )}

              {/* Top-level items */}
              {section.items && section.items.length > 0 && (
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 group">
                      <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300 group-hover:border-gray-400 transition" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Subsections */}
              {section.subsections?.map((sub, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100"
                >
                  <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">
                    {sub.title}
                  </h4>
                  <ul className="space-y-2">
                    {sub.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border border-gray-400 group-hover:border-gray-600 transition" />
                        <span className="text-gray-700 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {section.footer && (
                <div className="bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-lg border border-amber-100 flex gap-2">
                  <span>⚠️</span>
                  {section.footer}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
