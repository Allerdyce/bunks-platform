"use client";

import { useState } from "react";

type Range = { start: string; end: string; kind: "reservation" | "blocked" };
type Feed = { label: string; ok: boolean; error?: string; ranges: Range[] };
type CheckResult = {
  feeds: Feed[];
  diff: { complete: boolean; missingOnSite: string[]; onlyOnSite: string[] };
  blockedNights: { airbnbAndOther: string[]; direct: string[] };
  directBookings: Array<{ start: string; end: string; reference: string | null }>;
};

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Collapses a sorted list of nights (YYYY-MM-DD) into "Oct 9 → Oct 11" check-in/checkout ranges. */
function toRanges(nights: string[]) {
  const ranges: Array<{ start: string; end: string }> = [];
  for (const night of nights) {
    const next = new Date(`${night}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const nextIso = next.toISOString().slice(0, 10);
    const last = ranges[ranges.length - 1];
    if (last && last.end === night) last.end = nextIso;
    else ranges.push({ start: night, end: nextIso });
  }
  return ranges;
}

// Shows what each linked calendar says and what Bunks blocks, so the owner can compare
// against the Airbnb/Vrbo multi-calendar before trusting the sync.
export function CalendarCheck({ slug }: { slug: string }) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/calendar-check?slug=${encodeURIComponent(slug)}`, { credentials: "include" });
      const data = (await res.json()) as CheckResult & { error?: string };
      if (!res.ok) throw new Error(data.error || "Check failed");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const bunksBlocked = result ? toRanges(result.blockedNights.airbnbAndOther) : [];

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? "Checking…" : "Check calendars"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {result && (
        <div
          role="status"
          className={`rounded-xl p-4 text-sm ${
            !result.diff.complete || result.diff.missingOnSite.length
              ? "border border-red-200 bg-red-50 text-red-800"
              : "border border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {!result.diff.complete ? (
            <p>At least one calendar couldn&apos;t be read (see below), so this comparison is incomplete.</p>
          ) : result.diff.missingOnSite.length ? (
            <>
              <p className="font-semibold">
                Booked or blocked elsewhere but still open on Bunks: press “Sync now”, then check again.
              </p>
              <ul className="mt-1">
                {toRanges(result.diff.missingOnSite).map((range) => (
                  <li key={range.start}>
                    {fmt(range.start)} → {fmt(range.end)}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="font-semibold">In sync: every night booked or blocked on these calendars is unavailable on Bunks.</p>
          )}
          {result.diff.onlyOnSite.length > 0 && (
            <p className="mt-2 text-gray-700">
              Unavailable on Bunks only (direct bookings or your own blocks):{" "}
              {toRanges(result.diff.onlyOnSite)
                .map((range) => `${fmt(range.start)} → ${fmt(range.end)}`)
                .join(", ")}
            </p>
          )}
        </div>
      )}
      {result && (
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          {result.feeds.map((feed) => (
            <div key={feed.label} className="rounded-xl border border-gray-200 p-4">
              <p className="font-semibold text-gray-900">{feed.label}</p>
              {!feed.ok ? (
                <p className="mt-1 text-red-700">{feed.error}</p>
              ) : feed.ranges.length === 0 ? (
                <p className="mt-1 text-gray-500">No upcoming stays or blocks.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {feed.ranges.map((range) => (
                    <li key={`${range.start}-${range.end}-${range.kind}`} className="flex justify-between gap-3">
                      <span>
                        {fmt(range.start)} → {fmt(range.end)}
                      </span>
                      <span className={range.kind === "reservation" ? "text-gray-900" : "text-gray-500"}>
                        {range.kind === "reservation" ? "Reservation" : "Blocked"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="rounded-xl border border-gray-900/20 bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">Blocked on Bunks (from these calendars)</p>
            {bunksBlocked.length === 0 ? (
              <p className="mt-1 text-gray-500">Nothing imported yet. Press “Sync now”.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {bunksBlocked.map((range) => (
                  <li key={range.start}>
                    {fmt(range.start)} → {fmt(range.end)}
                  </li>
                ))}
              </ul>
            )}
            {result.directBookings.length > 0 && (
              <>
                <p className="mt-3 font-semibold text-gray-900">Direct Bunks bookings</p>
                <ul className="mt-1 space-y-1">
                  {result.directBookings.map((booking) => (
                    <li key={`${booking.start}-${booking.reference}`}>
                      {fmt(booking.start)} → {fmt(booking.end)} · {booking.reference}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-3 text-xs text-gray-500">
              Dates are check-in → check-out. The checkout day itself stays bookable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
