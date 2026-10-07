"use client";

import { Fragment, useState } from "react";
import { Copy, Loader2, Mail, RefreshCw, Search, X } from "lucide-react";
import {
  expiresIn,
  formatMoney,
  formatStayRange,
  groupLabel,
  shortHomeName,
  STATUS_STYLE,
  type AdminBooking,
  type BookingView,
} from "./bookingDisplay";

const NOUN: Record<BookingView, [string, string]> = {
  upcoming: ["upcoming stay", "upcoming stays"],
  links: ["payment link", "payment links"],
  past: ["past stay", "past stays"],
  cancelled: ["cancelled booking", "cancelled bookings"],
  unpaid: ["unpaid checkout", "unpaid checkouts"],
};

const EMPTY: Record<BookingView | "search", string> = {
  upcoming: "No upcoming stays.",
  links: "No payment links yet. Use “New private booking” to send one.",
  past: "No past stays yet.",
  cancelled: "No cancelled bookings.",
  unpaid: "No unpaid checkouts.",
  search: "No bookings match that search.",
};

// Right column of Admin → Bookings: search and the bookings table. Rows open the booking.
export function BookingTable({
  view,
  searchActive,
  loading,
  bookings,
  onSearch,
  onRefresh,
  onSelect,
  onChanged,
}: {
  view: BookingView;
  searchActive: string;
  loading: boolean;
  bookings: AdminBooking[];
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onSelect: (id: number) => void;
  onChanged: () => void;
}) {
  const [query, setQuery] = useState(searchActive);
  const listView = searchActive ? "search" : view;
  const summary = searchActive
    ? `${bookings.length} result${bookings.length === 1 ? "" : "s"} for “${searchActive}” across all bookings`
    : `${bookings.length} ${bookings.length === 1 ? NOUN[view][0] : NOUN[view][1]}`;

  // Section rows (month, or link state) in table order.
  const groups: { label: string; items: AdminBooking[] }[] = [];
  for (const booking of bookings) {
    const label = groupLabel(listView, booking);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(booking);
    else groups.push({ label, items: [booking] });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <form
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(query.trim());
          }}
        >
          <Search className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by guest name, email or booking ref"
            aria-label="Search bookings"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-9 text-sm focus:border-gray-900 focus:outline-none"
          />
          {searchActive && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                onSearch("");
              }}
              className="absolute right-3 top-2.5 rounded-full p-0.5 text-gray-400 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh"
          title="Refresh"
          className="rounded-xl border border-gray-200 bg-white px-3 text-gray-600 hover:border-gray-400"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-3 text-sm text-gray-500">{summary}</div>
        {loading && !bookings.length ? (
          <p className="flex items-center gap-2 px-6 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading bookings…
          </p>
        ) : !bookings.length ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">{EMPTY[listView]}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Guest</th>
                  <th className="hidden px-6 py-3 sm:table-cell">Home</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="hidden px-6 py-3 text-right md:table-cell">Total</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {groups.map((group) => (
                  <Fragment key={group.label}>
                    <tr>
                      <th
                        colSpan={5}
                        scope="colgroup"
                        className="border-b border-gray-100 bg-gray-50/50 px-6 pb-2 pt-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                      >
                        {group.label}
                      </th>
                    </tr>
                    {group.items.map((booking) => (
                      <BookingRow
                        key={booking.id}
                        booking={booking}
                        showLinkActions={listView === "links"}
                        onSelect={() => onSelect(booking.id)}
                        onChanged={onChanged}
                      />
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingRow({
  booking,
  showLinkActions,
  onSelect,
  onChanged,
}: {
  booking: AdminBooking;
  showLinkActions: boolean;
  onSelect: () => void;
  onChanged: () => void;
}) {
  const status = STATUS_STYLE[booking.displayStatus];
  const waiting = booking.displayStatus === "link-waiting" && booking.paymentLink;
  return (
    <tr
      onClick={onSelect}
      className="cursor-pointer border-b border-gray-100 align-top transition-colors last:border-b-0 hover:bg-gray-50/60"
    >
      <td className="px-6 py-4">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          className="block text-left text-sm font-semibold leading-5 text-gray-900 hover:underline"
        >
          {booking.guestName}
        </button>
        <div className="mt-0.5 text-xs text-gray-500">
          {booking.referenceCode ?? "—"}
          {booking.guestCount ? ` · ${booking.guestCount} guest${booking.guestCount === 1 ? "" : "s"}` : ""}
          <span className="sm:hidden"> · {shortHomeName(booking.property.slug, booking.property.name)}</span>
        </div>
        {showLinkActions && waiting && (
          <LinkActions bookingId={booking.id} url={booking.paymentLink!.url} onChanged={onChanged} />
        )}
      </td>
      <td className="hidden px-6 py-4 text-sm text-gray-600 sm:table-cell">
        {shortHomeName(booking.property.slug, booking.property.name)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        <div className="whitespace-nowrap">{formatStayRange(booking.checkInDate, booking.checkOutDate)}</div>
        <div className="mt-0.5 text-xs text-gray-500">
          {booking.nights} night{booking.nights === 1 ? "" : "s"}
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 md:table-cell">
        {formatMoney(booking.totalPriceCents)}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col items-end gap-1">
          <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
            {booking.displayStatus === "cancelled" && booking.wasPaid ? "Cancelled after payment" : status.label}
          </span>
          {waiting && <span className="text-xs text-gray-500">{expiresIn(booking.paymentLink!.holdUntilIso)}</span>}
        </div>
      </td>
    </tr>
  );
}

function LinkActions({ bookingId, url, onChanged }: { bookingId: number; url: string; onChanged: () => void }) {
  const [state, setState] = useState<"idle" | "copied" | "sending" | "sent" | "cancelling">("idle");
  const [error, setError] = useState<string | null>(null);
  const button =
    "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50";

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setState("copied");
    setTimeout(() => setState("idle"), 2000);
  };
  const resend = async () => {
    setState("sending");
    setError(null);
    const res = await fetch(`/api/admin/payment-links/${bookingId}/email`, { method: "POST", credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) setState("sent");
    else {
      setState("idle");
      setError(data.error ?? "Couldn't send the email.");
    }
  };
  const cancel = async () => {
    if (!window.confirm("Cancel this payment link? The guest won't be able to pay and the dates open up on Bunks and Airbnb.")) return;
    setState("cancelling");
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refund: "none" }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) onChanged();
    else {
      setState("idle");
      setError(data.error ?? "Couldn't cancel the link.");
    }
  };

  return (
    // Clicks here act on the link, not open the booking.
    <div className="-ml-1.5 mt-2 flex flex-wrap items-center gap-1" onClick={(event) => event.stopPropagation()}>
      <button type="button" onClick={copy} className={button}>
        <Copy className="h-3 w-3" /> {state === "copied" ? "Copied" : "Copy link"}
      </button>
      <button type="button" onClick={resend} disabled={state === "sending" || state === "sent"} className={button}>
        <Mail className="h-3 w-3" /> {state === "sending" ? "Sending…" : state === "sent" ? "Emailed" : "Resend"}
      </button>
      <button type="button" onClick={cancel} disabled={state === "cancelling"} className={`${button} text-red-600 hover:bg-red-50 hover:text-red-700`}>
        {state === "cancelling" ? "Cancelling…" : "Cancel"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
