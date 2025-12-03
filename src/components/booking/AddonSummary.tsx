"use client";

import type { AddonLineItem } from "@/types";

interface AddonSummaryProps {
  items: AddonLineItem[];
  currency: string;
}

const formatCurrency = (amountCents: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountCents / 100);

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

function parseDateValue(value?: string | null) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return new Date(Date.UTC(year, month - 1, day));
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatActivityDate(value?: string | null) {
  const parsed = parseDateValue(value);
  if (!parsed) return value ?? null;
  return dateFormatter.format(parsed);
}

function formatActivityTime(value?: string | null) {
  if (!value) return null;
  const [hourStr, minuteStr] = value.split(':');
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }
  const reference = new Date(Date.UTC(1970, 0, 1, hours, minutes));
  return timeFormatter.format(reference);
}

export function AddonSummary({ items, currency }: AddonSummaryProps) {
  if (!items.length) {
    return (
      <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-4 text-sm text-gray-500">
        No add-ons selected yet — pick a concierge experience to elevate your stay.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-start justify-between text-sm">
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{item.title}</p>
            <p className="text-xs uppercase tracking-wide text-gray-500">{item.provider}</p>
            {(item.activityDate || item.activityTimeSlot) && (
              <p className="text-xs text-gray-500">
                {formatActivityDate(item.activityDate)}
                {item.activityDate && item.activityTimeSlot && " · "}
                {formatActivityTime(item.activityTimeSlot)}
              </p>
            )}
            {item.status && (
              <p className="text-xs text-gray-500">
                Status: <span className="font-medium text-gray-700">{item.status}</span>
              </p>
            )}
            {item.confirmationCode && (
              <p className="text-xs text-gray-500 break-all">
                Confirmation: <span className="font-mono text-gray-700">{item.confirmationCode}</span>
              </p>
            )}
          </div>
          <span className="font-medium text-gray-900">{formatCurrency(item.priceCents, currency)}</span>
        </div>
      ))}
    </div>
  );
}
