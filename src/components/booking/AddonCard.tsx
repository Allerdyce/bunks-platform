"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import type { AddonScheduleValue, PropertyAddon } from "@/types";

const DEFAULT_ACTIVITY_TIME = "16:00";

interface AddonCardProps {
  addon: PropertyAddon;
  selected: boolean;
  schedule?: AddonScheduleValue;
  onToggle: (addonId: number) => void;
  onScheduleChange: (addonId: number, schedule: Partial<AddonScheduleValue>) => void;
  minDate?: string;
  maxDate?: string;
}

const centsToCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value / 100);

export function AddonCard({ addon, selected, schedule, onToggle, onScheduleChange, minDate, maxDate }: AddonCardProps) {
  const handleClick = () => onToggle(addon.id);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle(addon.id);
    }
  };
  const activityDateValue = schedule?.activityDate ?? "";
  const activityTimeValue = schedule?.activityTimeSlot ?? DEFAULT_ACTIVITY_TIME;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-pressed={selected}
      className={`flex flex-col border rounded-2xl text-left transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
        selected ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {addon.imageUrl ? (
        <div className="relative w-full h-40 overflow-hidden rounded-t-2xl">
          <Image
            src={addon.imageUrl}
            alt={addon.title}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 33vw, 100vw"
          />
        </div>
      ) : (
        <div className="h-40 rounded-t-2xl bg-gray-100" />
      )}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
          <span>{addon.category}</span>
          {addon.provider === "viator" ? <span>via Viator</span> : <span>custom</span>}
        </div>
        <h4 className="font-serif text-lg text-gray-900">{addon.title}</h4>
        <p className="text-sm text-gray-600 line-clamp-3 flex-1">{addon.description}</p>
        <div className="flex items-center justify-between pt-3">
          <p className="text-base font-semibold text-gray-900">
            {centsToCurrency(addon.basePriceCents, addon.currency ?? "USD")}
          </p>
          <span
            className={`inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full border ${
              selected
                ? "bg-gray-900 text-white border-gray-900"
                : "text-gray-900 border-gray-300 bg-white"
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${selected ? "text-white" : "text-gray-400"}`}
            />
            {selected ? "Added" : "Add Experience"}
          </span>
        </div>
        {selected && (
          <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 text-sm text-gray-700">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Activity date</label>
              <input
                type="date"
                value={activityDateValue}
                min={minDate}
                max={maxDate}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) =>
                  onScheduleChange(addon.id, {
                    activityDate: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              {minDate && maxDate && (
                <p className="text-xs text-gray-500">
                  Must be between {minDate} and {maxDate}.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Preferred start time</label>
              <input
                type="time"
                value={activityTimeValue}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) =>
                  onScheduleChange(addon.id, {
                    activityTimeSlot: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <p className="text-xs text-gray-500">Times shown in the property’s local timezone.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
