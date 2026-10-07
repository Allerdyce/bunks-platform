"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, CheckCircle2, Copy, Loader2 } from "lucide-react";
import type { DateRange } from "@/types";
import { formatStayDate } from "@/lib/availability";

const Calendar = dynamic(() => import("@/components/shared/Calendar").then((mod) => mod.Calendar), {
  loading: () => <div className="p-4 text-center text-sm text-gray-500">Loading calendar...</div>,
  ssr: false,
});

type Home = { id: number; name: string; slug: string; maxGuests: number | null };
type Tax = { name: string; rate: number; appliesTo: string[] };
type ChargeKey = "nightlySubtotalCents" | "cleaningFeeCents" | "serviceFeeCents" | "taxCents";
type Created = { bookingId: number; url: string; holdUntil: string; totalPriceCents: number; warning?: string };

const CHARGE_FIELDS: { key: ChargeKey; label: string }[] = [
  { key: "nightlySubtotalCents", label: "Nights (total)" },
  { key: "cleaningFeeCents", label: "Cleaning fee" },
  { key: "serviceFeeCents", label: "Service fee" },
  { key: "taxCents", label: "Tax" },
];
const HOLD_OPTIONS = [
  { hours: 24, label: "24 hours" },
  { hours: 48, label: "48 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
];
const EMPTY_CHARGES: Record<ChargeKey, string> = { nightlySubtotalCents: "", cleaningFeeCents: "", serviceFeeCents: "", taxCents: "" };

const toDollars = (cents: number) => (cents / 100).toFixed(2);
const toCents = (dollars: string) => Math.round(Number(dollars || "0") * 100);
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const inputClass = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none";

/** Tax on the entered fees, using the home's tax rules (same as checkout). */
const taxFor = (taxes: Tax[], charges: Record<ChargeKey, string>) =>
  taxes.reduce((total, tax) => {
    let base = 0;
    if (tax.appliesTo.includes("nightly")) base += toCents(charges.nightlySubtotalCents);
    if (tax.appliesTo.includes("cleaning")) base += toCents(charges.cleaningFeeCents);
    if (tax.appliesTo.includes("service")) base += toCents(charges.serviceFeeCents);
    return total + Math.round(base * tax.rate);
  }, 0);

export function PrivateBookingForm({ onClose, onCreated }: { onClose: () => void; onCreated: (bookingId: number) => void }) {
  const [homes, setHomes] = useState<Home[]>([]);
  const [homeId, setHomeId] = useState<number | null>(null);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guests, setGuests] = useState("2");
  const [charges, setCharges] = useState(EMPTY_CHARGES);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [taxEdited, setTaxEdited] = useState(false);
  const [serviceFeeRate, setServiceFeeRate] = useState<number | null>(null);
  const [serviceEdited, setServiceEdited] = useState(false);
  const [priceNote, setPriceNote] = useState<string | null>(null);
  const [holdHours, setHoldHours] = useState(48);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent">("idle");
  const [copied, setCopied] = useState(false);

  const home = homes.find((candidate) => candidate.id === homeId) ?? null;
  const checkIn = range.start ? formatStayDate(range.start) : null;
  const checkOut = range.end ? formatStayDate(range.end) : null;

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/properties/settings", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { properties?: Home[] };
      const list = (data.properties ?? []).map(({ id, name, slug, maxGuests }) => ({ id, name, slug, maxGuests }));
      setHomes(list);
      setHomeId((current) => current ?? list[0]?.id ?? null);
    })();
  }, []);

  // The calendar shows what guests see as taken: bookings, Airbnb, blocks and other holds.
  useEffect(() => {
    if (!home) return;
    setRange({ start: null, end: null });
    void (async () => {
      const res = await fetch(`/api/properties/${home.slug}/blocked-dates`);
      const data = (await res.json().catch(() => ({}))) as { blockedDates?: { date: string }[] };
      setBlockedDates((data.blockedDates ?? []).map((entry) => entry.date));
    })();
  }, [home]);

  // Pre-fill with the standard price whenever the stay changes; every amount stays editable.
  useEffect(() => {
    if (!homeId || !checkIn || !checkOut) return;
    void (async () => {
      const params = new URLSearchParams({ propertyId: String(homeId), checkIn, checkOut });
      const res = await fetch(`/api/admin/payment-links/quote?${params}`, { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        charges?: Record<ChargeKey, number> | null;
        serviceFeeRate?: number;
        taxes?: Tax[];
        error?: string;
      };
      setTaxes(data.taxes ?? []);
      setTaxEdited(false);
      setServiceFeeRate(data.serviceFeeRate ?? null);
      setServiceEdited(false);
      if (data.charges) {
        setCharges({
          nightlySubtotalCents: toDollars(data.charges.nightlySubtotalCents),
          cleaningFeeCents: toDollars(data.charges.cleaningFeeCents),
          serviceFeeCents: toDollars(data.charges.serviceFeeCents),
          taxCents: toDollars(data.charges.taxCents),
        });
        setPriceNote("Pre-filled with the standard price for these dates. Change any amount.");
      } else {
        setCharges(EMPTY_CHARGES);
        setPriceNote(data.error ?? "There's no standard price for these dates yet, so enter the amounts.");
      }
    })();
  }, [homeId, checkIn, checkOut]);

  const setCharge = (key: ChargeKey, value: string) => {
    setCharges((current) => {
      const next = { ...current, [key]: value };
      // The service fee and tax follow the other fees until they're typed over.
      if (key === "nightlySubtotalCents" && !serviceEdited && serviceFeeRate !== null) {
        next.serviceFeeCents = toDollars(Math.round(toCents(value) * serviceFeeRate));
      }
      if (key !== "taxCents" && !taxEdited && taxes.length) next.taxCents = toDollars(taxFor(taxes, next));
      return next;
    });
    if (key === "serviceFeeCents") setServiceEdited(true);
    if (key === "taxCents") setTaxEdited(true);
  };

  const totalCents = useMemo(
    () => CHARGE_FIELDS.reduce((total, field) => total + toCents(charges[field.key]), 0),
    [charges],
  );
  const taxHelp = taxes.length
    ? `Worked out from ${taxes.map((tax) => `${tax.name} ${Math.round(tax.rate * 10000) / 100}%`).join(" + ")}. Type over it to change it, or enter 0.`
    : "No taxes are set up for this home, so enter any tax yourself.";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!homeId || !checkIn || !checkOut) {
      setError("Choose the check-in and check-out dates.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payment-links", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: homeId,
          checkIn,
          checkOut,
          guestName,
          guestEmail,
          guests: Number(guests),
          holdHours,
          charges: Object.fromEntries(CHARGE_FIELDS.map((field) => [field.key, toCents(charges[field.key])])),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<Created> & { error?: string };
      if (!res.ok || !data.url || !data.bookingId) throw new Error(data.error ?? "Couldn't create the payment link.");
      setCreated(data as Created);
      onCreated(data.bookingId);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const emailGuest = async () => {
    if (!created) return;
    setEmailState("sending");
    setError(null);
    const res = await fetch(`/api/admin/payment-links/${created.bookingId}/email`, { method: "POST", credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      setEmailState("sent");
    } else {
      setEmailState("idle");
      setError(data.error ?? "Couldn't send the email.");
    }
  };

  const copyLink = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 sm:p-10">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Bookings</p>
          <h2 className="mt-2 font-serif text-3xl text-gray-900">New private booking</h2>
          <p className="mt-2 text-sm text-gray-500">
            Set the price for one guest. Bunks holds the dates, here and on Airbnb, and the guest pays by card from a private link.
          </p>
        </div>
      </header>

      {created ? (
        <section className="space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
          <p className="flex items-center gap-2 font-medium text-gray-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Link ready: {money(created.totalPriceCents)}, dates held for{" "}
            {HOLD_OPTIONS.find((option) => option.hours === holdHours)?.label ?? `${holdHours} hours`}.
          </p>
          {created.warning && <p className="text-sm text-amber-700">{created.warning}</p>}
          <div className="flex gap-2">
            <input readOnly value={created.url} className={`${inputClass} mt-0 font-mono text-xs`} aria-label="Payment link" />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={emailGuest}
              disabled={emailState !== "idle"}
              className="inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {emailState === "sending" ? "Sending…" : emailState === "sent" ? `Emailed to ${guestEmail}` : "Email link to guest"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Done
            </button>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </section>
      ) : (
        <form onSubmit={submit} className="space-y-8">
          <section className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Home
              <select
                value={homeId ?? ""}
                onChange={(event) => setHomeId(Number(event.target.value))}
                className={inputClass}
              >
                {homes.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Dates{" "}
                <span className="font-normal text-gray-500">
                  {checkIn && checkOut ? `· ${checkIn} → ${checkOut}` : "· pick check-in, then check-out"}
                </span>
              </p>
              <div className="mt-2 rounded-xl border border-gray-100 bg-white">
                <Calendar blockedDates={blockedDates} minStay={{ default: 1 }} selectedRange={range} onSelectDates={setRange} />
              </div>
              <p className="mt-2 text-xs text-gray-500">Greyed-out nights are booked, blocked or held, here or on Airbnb.</p>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium text-gray-700 sm:col-span-1">
              Guest name
              <input required value={guestName} onChange={(event) => setGuestName(event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-gray-700 sm:col-span-1">
              Guest email
              <input required type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-gray-700 sm:col-span-1">
              Guests{home?.maxGuests ? ` (max ${home.maxGuests})` : ""}
              <input
                required
                type="number"
                min={1}
                max={home?.maxGuests ?? 50}
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className={inputClass}
              />
            </label>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Price</h3>
            {priceNote && <p className="text-sm text-gray-500">{priceNote}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {CHARGE_FIELDS.map((field) => (
                <label key={field.key} className="block text-sm font-medium text-gray-700">
                  {field.label} ($)
                  <input
                    required
                    inputMode="decimal"
                    pattern="\d+(\.\d{1,2})?"
                    title="Dollars, e.g. 1250 or 1250.50"
                    value={charges[field.key]}
                    onChange={(event) => setCharge(field.key, event.target.value.trim())}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {serviceFeeRate !== null
                ? `The service fee is ${Math.round(serviceFeeRate * 100)}% of the nights until you type over it (enter 0 to waive it). `
                : ""}
              {taxHelp}
            </p>
            <p className="flex justify-between border-t border-gray-100 pt-3 text-base font-semibold text-gray-900">
              <span>Guest pays</span>
              <span>{money(totalCents)}</span>
            </p>
          </section>

          <section className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Hold the dates for
              <select value={holdHours} onChange={(event) => setHoldHours(Number(event.target.value))} className={inputClass}>
                {HOLD_OPTIONS.map((option) => (
                  <option key={option.hours} value={option.hours}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-gray-500">If the guest hasn&apos;t paid by then, the link expires and the dates open up again.</p>
          </section>

          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Hold dates and create link
          </button>
        </form>
      )}
    </div>
  );
}
