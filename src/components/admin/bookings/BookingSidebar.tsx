"use client";

import { shortHomeName, VIEW_TABS, type BookingView } from "./bookingDisplay";

const VIEW_HINT: Record<BookingView, string> = {
  upcoming: "Paid stays not yet checked out",
  links: "Private prices sent to a guest",
  past: "Completed stays",
  cancelled: "Paid or linked, then cancelled",
  unpaid: "Checkouts that were never paid",
};

// Left column of Admin → Bookings, in the same card style as Emails and Pricing.
export function BookingSidebar({
  view,
  counts,
  searchActive,
  homes,
  home,
  onViewChange,
  onHomeChange,
}: {
  view: BookingView;
  counts: Partial<Record<BookingView, number>>;
  searchActive: boolean;
  homes: { slug: string; name: string }[];
  home: string;
  onViewChange: (view: BookingView) => void;
  onHomeChange: (home: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">Bookings</p>
        <h2 className="mt-3 text-xl font-semibold text-gray-900">Every stay in one place</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Direct bookings and private payment links. Click a booking to see the guest, what they paid and the emails
          they&apos;ve had, or to cancel and refund.
        </p>
      </section>

      <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-1" role="tablist" aria-label="Booking lists" aria-orientation="vertical">
          {VIEW_TABS.map((tab) => {
            const active = !searchActive && view === tab.view;
            return (
              <button
                key={tab.view}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onViewChange(tab.view)}
                className={`group flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                  active ? "bg-gray-900 text-white shadow-md" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>
                  <span className="block">{tab.label}</span>
                  <span className={`block text-xs font-normal ${active ? "text-gray-300" : "text-gray-500"}`}>
                    {VIEW_HINT[tab.view]}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  }`}
                >
                  {counts[tab.view] ?? "–"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-gray-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Home</p>
          <div className="flex flex-wrap gap-1.5">
            {[{ slug: "", name: "All homes" }, ...homes].map((option) => {
              const active = home === option.slug;
              return (
                <button
                  key={option.slug || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onHomeChange(option.slug)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {option.slug ? shortHomeName(option.slug, option.name) : option.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
