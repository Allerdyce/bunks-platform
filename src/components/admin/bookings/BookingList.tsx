"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Loader2, Mail, RefreshCw, Search, X } from "lucide-react";
import { getPropertyBySlug } from "@/data/properties";
import {
  expiresIn,
  formatMoney,
  formatStayRange,
  groupLabel,
  shortHomeName,
  STATUS_STYLE,
  VIEW_TABS,
  type AdminBooking,
  type BookingView,
} from "./bookingDisplay";

type BookingListProps = {
  view: BookingView;
  counts: Partial<Record<BookingView, number>>;
  homes: { slug: string; name: string }[];
  home: string;
  searchActive: string;
  loading: boolean;
  bookings: AdminBooking[];
  activeId: number | null;
  onViewChange: (view: BookingView) => void;
  onHomeChange: (home: string) => void;
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onSelect: (id: number) => void;
  onChanged: () => void;
};

export function BookingList(props: BookingListProps) {
  const [query, setQuery] = useState(props.searchActive);
  const listView = props.searchActive ? "search" : props.view;

  // Section headings (month, or link state) in list order.
  const groups: { label: string; items: AdminBooking[] }[] = [];
  for (const booking of props.bookings) {
    const label = groupLabel(listView, booking);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(booking);
    else groups.push({ label, items: [booking] });
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="space-y-4 border-b border-gray-100 p-5">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Booking lists">
          {VIEW_TABS.map((tab) => {
            const active = !props.searchActive && props.view === tab.view;
            return (
              <button
                key={tab.view}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setQuery("");
                  props.onViewChange(tab.view);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                {props.counts[tab.view] !== undefined && (
                  <span className={`ml-1.5 text-xs ${active ? "text-gray-300" : "text-gray-400"}`}>{props.counts[tab.view]}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <form
            className="relative flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              props.onSearch(query.trim());
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email or ref"
              aria-label="Search bookings"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm focus:border-gray-900 focus:bg-white focus:outline-none"
            />
            {props.searchActive && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  props.onSearch("");
                }}
                className="absolute right-2 top-2 rounded-full p-0.5 text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
          <select
            value={props.home}
            onChange={(event) => props.onHomeChange(event.target.value)}
            aria-label="Filter by home"
            className="rounded-xl border border-gray-200 bg-white px-2 text-sm text-gray-700"
          >
            <option value="">All homes</option>
            {props.homes.map((home) => (
              <option key={home.slug} value={home.slug}>
                {shortHomeName(home.slug, home.name)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={props.onRefresh}
            aria-label="Refresh"
            className="rounded-xl border border-gray-200 px-2.5 text-gray-600 hover:border-gray-400"
          >
            <RefreshCw className={`h-4 w-4 ${props.loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {props.searchActive && (
          <p className="text-xs text-gray-500">
            Results for “{props.searchActive}” across all bookings.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {props.loading && !props.bookings.length ? (
          <p className="flex items-center gap-2 p-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading bookings…
          </p>
        ) : !props.bookings.length ? (
          <p className="p-8 text-center text-sm text-gray-500">{emptyText(listView)}</p>
        ) : (
          groups.map((group) => (
            <section key={group.label}>
              <h3 className="sticky top-0 z-10 bg-gray-50/95 px-5 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 backdrop-blur">
                {group.label}
              </h3>
              <ul>
                {group.items.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    active={booking.id === props.activeId}
                    showLinkActions={listView === "links"}
                    onSelect={() => props.onSelect(booking.id)}
                    onChanged={props.onChanged}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function emptyText(view: BookingView | "search") {
  switch (view) {
    case "upcoming":
      return "No upcoming stays.";
    case "links":
      return "No payment links yet. Use “New private booking” to send one.";
    case "past":
      return "No past stays yet.";
    case "cancelled":
      return "No cancelled bookings.";
    case "unpaid":
      return "No unpaid checkouts.";
    default:
      return "No bookings match that search.";
  }
}

function BookingRow({
  booking,
  active,
  showLinkActions,
  onSelect,
  onChanged,
}: {
  booking: AdminBooking;
  active: boolean;
  showLinkActions: boolean;
  onSelect: () => void;
  onChanged: () => void;
}) {
  const image = getPropertyBySlug(booking.property.slug)?.image ?? null;
  const status = STATUS_STYLE[booking.displayStatus];
  const waiting = booking.displayStatus === "link-waiting";
  return (
    <li className={`border-b border-gray-100 ${active ? "bg-gray-50" : "hover:bg-gray-50/60"}`}>
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 px-5 py-3 text-left" aria-current={active}>
        {image ? (
          <Image src={image} alt="" width={40} height={40} className="mt-0.5 h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="mt-0.5 h-10 w-10 shrink-0 rounded-lg bg-gray-100" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate font-medium text-gray-900">{booking.guestName}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
              {status.label}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-sm text-gray-600">
            {shortHomeName(booking.property.slug, booking.property.name)} · {formatStayRange(booking.checkInDate, booking.checkOutDate)}
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">
            {booking.nights} night{booking.nights === 1 ? "" : "s"}
            {booking.guestCount ? ` · ${booking.guestCount} guest${booking.guestCount === 1 ? "" : "s"}` : ""} ·{" "}
            {formatMoney(booking.totalPriceCents)}
            {booking.referenceCode ? ` · ${booking.referenceCode}` : ""}
            {waiting && booking.paymentLink ? ` · ${expiresIn(booking.paymentLink.holdUntilIso)}` : ""}
          </span>
        </span>
      </button>
      {showLinkActions && waiting && booking.paymentLink && (
        <LinkActions bookingId={booking.id} url={booking.paymentLink.url} onChanged={onChanged} />
      )}
    </li>
  );
}

function LinkActions({ bookingId, url, onChanged }: { bookingId: number; url: string; onChanged: () => void }) {
  const [state, setState] = useState<"idle" | "copied" | "sending" | "sent" | "cancelling">("idle");
  const [error, setError] = useState<string | null>(null);
  const button = "inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:border-gray-400 disabled:opacity-50";

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
    <div className="flex flex-wrap items-center gap-2 px-5 pb-3 pl-[4.25rem]">
      <button type="button" onClick={copy} className={button}>
        <Copy className="h-3 w-3" /> {state === "copied" ? "Copied" : "Copy link"}
      </button>
      <button type="button" onClick={resend} disabled={state === "sending" || state === "sent"} className={button}>
        <Mail className="h-3 w-3" /> {state === "sending" ? "Sending…" : state === "sent" ? "Emailed" : "Resend"}
      </button>
      <button type="button" onClick={cancel} disabled={state === "cancelling"} className={`${button} text-red-600`}>
        {state === "cancelling" ? "Cancelling…" : "Cancel"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
