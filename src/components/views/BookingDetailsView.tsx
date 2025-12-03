"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import type { BookingDetailsData, BookingLookupPayload, NavigateHandler } from "@/types";
import { Button } from "@/components/shared/Button";
import { SteamboatGuestGuide } from "@/components/guides/SteamboatGuestGuide";
import { api } from "@/lib/api";

interface BookingDetailsViewProps {
  onNavigate: NavigateHandler;
  initialLookup?: BookingLookupPayload | null;
  onPersistLookup?: (payload: BookingLookupPayload | null) => void;
}

type PendingLookupState = BookingLookupPayload;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

function formatStayDates(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const startLabel = dateFormatter.format(start);
  const endLabel = dateFormatter.format(end);
  return `${startLabel} → ${endLabel}`;
}

function formatActivitySchedule(
  activityDate?: string | null,
  activityTimeSlot?: string | null,
  timezone?: string | null,
) {
  if (!activityDate) {
    return "Schedule pending";
  }

  const date = new Date(activityDate);
  if (activityTimeSlot) {
    const [hours, minutes] = activityTimeSlot.split(":").map((value) => Number.parseInt(value, 10));
    if (Number.isFinite(hours)) {
      date.setHours(hours, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    }
  }

  const dateLabel = dateFormatter.format(date);
  let timeLabelFormatter: Intl.DateTimeFormat;
  try {
    timeLabelFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone ?? undefined,
    });
  } catch {
    timeLabelFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const timeLabel = timeLabelFormatter.format(date);
  const tzSuffix = timezone ? ` (${timezone})` : "";
  return `${dateLabel} at ${timeLabel}${tzSuffix}`;
}

function getStatusStyles(status: string) {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "confirmed":
      return { badge: "bg-green-50 text-green-700", label: "Confirmed" };
    case "failed":
      return { badge: "bg-red-50 text-red-700", label: "Needs attention" };
    case "pending":
    case "pending-provider":
      return { badge: "bg-amber-50 text-amber-700", label: "Pending" };
    default:
      return { badge: "bg-slate-100 text-slate-700", label: status };
  }
}

const supportFallback = "hello@bunks.com";
const BOOKING_REFERENCE_PATTERN = /^[A-Z0-9]{5}$/;

function normalizeBookingReferenceInput(raw: string) {
  if (!raw) return null;
  const alphanumeric = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (BOOKING_REFERENCE_PATTERN.test(alphanumeric)) {
    return alphanumeric;
  }
  return null;
}

export function BookingDetailsView({ onNavigate, initialLookup, onPersistLookup }: BookingDetailsViewProps) {
  const [bookingReferenceInput, setBookingReferenceInput] = useState(initialLookup?.bookingReference ?? "");
  const [emailInput, setEmailInput] = useState(initialLookup?.guestEmail ?? "");
  const [booking, setBooking] = useState<BookingDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLookup, setLastLookup] = useState<PendingLookupState | null>(initialLookup ?? null);
  const autoLookupKey = useRef<string | null>(null);

  const handleLookup = useCallback(async (lookup: PendingLookupState) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.fetchBookingDetails(lookup.bookingReference, lookup.guestEmail);
      setBooking(response.booking);
      setLastLookup(lookup);
      onPersistLookup?.(lookup);
    } catch (lookupError) {
      console.error("Failed to load booking details", lookupError);
      const message =
        lookupError instanceof Error
          ? lookupError.message
          : "We couldn't find that booking. Double-check the details and try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [onPersistLookup]);

  useEffect(() => {
    if (!initialLookup?.bookingReference || !initialLookup?.guestEmail) {
      return;
    }
    const nextKey = `${initialLookup.bookingReference}:${initialLookup.guestEmail}`;
    if (autoLookupKey.current === nextKey) {
      return;
    }
    autoLookupKey.current = nextKey;
    setBookingReferenceInput(initialLookup.bookingReference);
    setEmailInput(initialLookup.guestEmail);
    void handleLookup({ bookingReference: initialLookup.bookingReference, guestEmail: initialLookup.guestEmail });
  }, [initialLookup, handleLookup]);

  const submitLookup = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const normalizedReference = normalizeBookingReferenceInput(bookingReferenceInput);
    const normalizedEmail = emailInput.trim();

    if (!normalizedReference || !normalizedEmail) {
      setError("Enter your booking reference (e.g., R57KF) and the email on file.");
      setBooking(null);
      return;
    }

    await handleLookup({ bookingReference: normalizedReference, guestEmail: normalizedEmail });
  };

  const addonSummary = useMemo(() => {
    if (!booking?.addons?.length) {
      return { confirmed: 0, pending: 0, failed: 0 };
    }
    return booking.addons.reduce(
      (acc, addon) => {
        const status = addon.providerStatus?.toLowerCase();
        if (status === "confirmed") acc.confirmed += 1;
        else if (status === "failed") acc.failed += 1;
        else acc.pending += 1;
        return acc;
      },
      { confirmed: 0, pending: 0, failed: 0 },
    );
  }, [booking]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 space-y-10">
      <section className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300 mb-2">My stay</p>
          <h1 className="font-serif text-3xl sm:text-4xl leading-tight">Manage your stay and experiences</h1>
          <p className="text-slate-200 mt-4 max-w-2xl">
            Enter your booking reference and email to review check-in details, add-on schedules, and confirmation codes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => onNavigate("home")}>Browse homes</Button>
          <Button onClick={() => onNavigate("listings")}>Book another stay</Button>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <form className="grid md:grid-cols-3 gap-4 items-end" onSubmit={submitLookup}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-600">Booking reference</span>
            <input
              type="text"
              value={bookingReferenceInput}
              onChange={(event) =>
                setBookingReferenceInput(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
              className="rounded-xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none uppercase tracking-[0.1em]"
              placeholder="e.g. R57KF"
              inputMode="text"
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-600">Email used on booking</span>
            <input
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
              placeholder="you@example.com"
            />
          </label>
          <div className="md:col-span-3 flex flex-col sm:flex-row gap-3">
            <Button type="submit" isLoading={isLoading} className="flex-1 sm:flex-none">
              View booking
            </Button>
            {lastLookup && (
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() =>
                  void handleLookup({
                    bookingReference: lastLookup.bookingReference,
                    guestEmail: lastLookup.guestEmail,
                  })
                }
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Refresh statuses
              </Button>
            )}
          </div>
        </form>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
      </section>

      {isLoading && (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center text-slate-500">
          Fetching your booking details...
        </div>
      )}

      {!isLoading && !booking && !error && (
        <div className="text-center text-slate-500 py-12">
          We&apos;ll display your itinerary and add-ons once you look up a booking.
        </div>
      )}

      {booking && (
        <div className="space-y-8">
          <section className="bg-white border border-slate-100 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-2">
                  Booking #{booking.referenceCode ?? booking.id}
                </p>
                <h2 className="font-serif text-3xl text-slate-900">{booking.property.name}</h2>
                <p className="text-slate-600 mt-2">{formatStayDates(booking.checkInDate, booking.checkOutDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {currencyFormatter.format(booking.totalPriceCents / 100)}
                </p>
              </div>
            </div>
            <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-slate-500">Check-in</p>
                  <p className="font-medium text-slate-900">{dateFormatter.format(new Date(booking.checkInDate))}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-slate-500">Check-out</p>
                  <p className="font-medium text-slate-900">{dateFormatter.format(new Date(booking.checkOutDate))}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                <Clock className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-slate-500">Add-on status</p>
                  <p className="font-medium text-slate-900">
                    {booking.addons.length === 0
                      ? "No add-ons"
                      : `${addonSummary.confirmed} confirmed • ${addonSummary.pending} pending • ${addonSummary.failed} failed`}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-100 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Activities & Add-ons</p>
                <h3 className="font-serif text-2xl text-slate-900 mt-1">Experiences for this stay</h3>
                <p className="text-slate-500 mt-2">
                  Track provider confirmations, timing, and refund status for every add-on you selected.
                </p>
              </div>
              {lastLookup && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    void handleLookup({
                      bookingReference: lastLookup.bookingReference,
                      guestEmail: lastLookup.guestEmail,
                    })
                  }
                  disabled={isLoading}
                >
                  Refresh add-ons
                </Button>
              )}
            </div>

            {booking.addons.length === 0 && (
              <div className="mt-6 p-6 rounded-2xl bg-slate-50 text-slate-500">
                Add-ons are coming soon to Bunks.com.
              </div>
            )}

            <div className="mt-6 space-y-4">
              {booking.addons.map((addon) => {
                const statusStyles = getStatusStyles(addon.providerStatus ?? "");
                const scheduleLabel = formatActivitySchedule(
                  addon.activityDate,
                  addon.activityTimeSlot,
                  booking.property.timezone,
                );
                const isFailed = addon.providerStatus?.toLowerCase() === "failed";
                const isConfirmed = addon.providerStatus?.toLowerCase() === "confirmed";

                return (
                  <div
                    key={addon.id}
                    className="border border-slate-100 rounded-2xl p-5 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{addon.provider}</p>
                        <h4 className="text-lg font-semibold text-slate-900">{addon.title}</h4>
                        <p className="text-sm text-slate-500 mt-1">{scheduleLabel}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles.badge}`}>
                          {statusStyles.label}
                        </span>
                        <p className="text-slate-900 font-semibold">
                          {currencyFormatter.format(addon.finalPriceCents / 100)}
                        </p>
                      </div>
                    </div>

                    {addon.providerConfirmationCode && (
                      <div className="mt-4 text-sm text-slate-600 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> Confirmation code:
                        <span className="font-mono text-slate-900">{addon.providerConfirmationCode}</span>
                      </div>
                    )}

                    {isFailed && (
                      <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 mt-0.5" />
                        <div>
                          <p className="font-semibold">We couldn&apos;t confirm this experience.</p>
                          <p>
                            A refund for this add-on will be issued automatically. Need help? Contact
                            {" "}
                            <a
                              href={`mailto:${booking.property.hostSupportEmail ?? supportFallback}`}
                              className="underline"
                            >
                              {booking.property.hostSupportEmail ?? supportFallback}
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                    )}

                    {!isFailed && !isConfirmed && (
                      <div className="mt-4 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 mt-0.5" />
                        <div>
                          <p className="font-semibold">Hang tight—this add-on is still processing.</p>
                          <p>
                            We&apos;ll email you as soon as the provider locks in the time slot. You can refresh the status from this
                            page anytime.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {booking.property.slug === "steamboat-downtown-townhome" && (
            <section className="border border-slate-100 rounded-3xl bg-white">
              <SteamboatGuestGuide showSecureDetails className="py-12" />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
