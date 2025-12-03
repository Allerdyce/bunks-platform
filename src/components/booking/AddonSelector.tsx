"use client";

import { Loader2 } from "lucide-react";
import type { AddonScheduleValue, PropertyAddon } from "@/types";
import { AddonCard } from "./AddonCard";

interface AddonSelectorProps {
  addons: PropertyAddon[];
  selectedIds: number[];
  schedules: Record<number, AddonScheduleValue>;
  onToggle: (addonId: number) => void;
  onScheduleChange: (addonId: number, schedule: Partial<AddonScheduleValue>) => void;
  isLoading: boolean;
  error?: string | null;
  minDate?: string;
  maxDate?: string;
}

export function AddonSelector({
  addons,
  selectedIds,
  schedules,
  onToggle,
  onScheduleChange,
  isLoading,
  error,
  minDate,
  maxDate,
}: AddonSelectorProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-2xl text-gray-900">Curated experiences</h3>
          <p className="text-sm text-gray-500">Enhance your stay with hand-picked luxury add-ons.</p>
        </div>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!isLoading && addons.length === 0 && !error ? (
        <p className="text-sm text-gray-500">No add-ons are currently available for this property.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {addons.map((addon) => (
            <AddonCard
              key={addon.id}
              addon={addon}
              selected={selectedIds.includes(addon.id)}
              schedule={schedules[addon.id]}
              onToggle={onToggle}
              onScheduleChange={onScheduleChange}
              minDate={minDate}
              maxDate={maxDate}
            />
          ))}
        </div>
      )}
    </section>
  );
}
