"use client";

import { useState } from "react";

export type AdminBookingStatus = "PENDING" | "PAID" | "CANCELLED";

type Props = {
  bookingId: number;
  status: AdminBookingStatus;
  totalPriceCents: number;
  checkInDate: string;
  // An unpaid private payment link: cancelling stops the guest paying and frees the dates.
  paymentLink?: boolean;
  onCancelled: () => void;
};

type RefundChoice = "full" | "half" | "none" | "custom";

const DAY_MS = 86_400_000;
const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

// Mirrors src/data/policies.ts: full refund 30+ days out, 50% at 7–30 days, none inside 7 days.
function policySuggestion(checkInDate: string): RefundChoice {
  const daysOut = (new Date(checkInDate).getTime() - Date.now()) / DAY_MS;
  if (daysOut >= 30) return "full";
  if (daysOut >= 7) return "half";
  return "none";
}

export function CancelBookingControl({ bookingId, status, totalPriceCents, checkInDate, paymentLink, onCancelled }: Props) {
  const [open, setOpen] = useState(false);
  const suggested = policySuggestion(checkInDate);
  const [choice, setChoice] = useState<RefundChoice>(suggested);
  const [customDollars, setCustomDollars] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  if (status === "CANCELLED") {
    return (
      <p role="status" className={`text-sm ${message?.type === "success" ? "text-emerald-700" : "text-gray-500"}`}>
        {message?.type === "success" ? message.text : "This booking is cancelled."}
      </p>
    );
  }

  const isPaid = status === "PAID";
  const refundCents =
    !isPaid || choice === "none"
      ? 0
      : choice === "full"
        ? totalPriceCents
        : choice === "half"
          ? Math.round(totalPriceCents / 2)
          : Math.round(Number(customDollars) * 100);
  const customInvalid =
    isPaid && choice === "custom" && (!Number.isFinite(refundCents) || refundCents < 0 || refundCents > totalPriceCents);

  const submit = async () => {
    if (customInvalid) return;
    const summary = isPaid
      ? `Cancel this booking and refund ${money(refundCents)} of ${money(totalPriceCents)}? The dates open up on Bunks and Airbnb. This can't be undone.`
      : paymentLink
        ? "Cancel this payment link? The guest won't be able to pay and the dates open up on Bunks and Airbnb."
        : "Release this unpaid hold? The dates open up again.";
    if (!window.confirm(summary)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refund: isPaid ? refundCents : "none" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; refundCents?: number };
      if (!res.ok) throw new Error(data.error || "Cancellation failed");
      setMessage({
        type: "success",
        text: isPaid
          ? `Cancelled. Refunded ${money(data.refundCents ?? 0)}; the guest has been emailed.`
          : paymentLink
            ? "Payment link cancelled. The dates are open again."
            : "Hold released.",
      });
      setOpen(false);
      onCancelled();
    } catch (error) {
      setMessage({ type: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const options: Array<{ id: RefundChoice; label: string }> = [
    { id: "full", label: `Full refund · ${money(totalPriceCents)}` },
    { id: "half", label: `50% refund · ${money(Math.round(totalPriceCents / 2))}` },
    { id: "none", label: "No refund" },
    { id: "custom", label: "Other amount" },
  ];

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          {isPaid ? "Cancel booking…" : paymentLink ? "Cancel payment link…" : "Release unpaid hold…"}
        </button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50/40 p-4">
          {isPaid && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-900">Refund</legend>
              {options.map((option) => (
                <label key={option.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name={`refund-${bookingId}`}
                    checked={choice === option.id}
                    onChange={() => setChoice(option.id)}
                  />
                  {option.label}
                  {option.id === suggested && <span className="text-xs text-gray-500">(your policy)</span>}
                </label>
              ))}
              {choice === "custom" && (
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Amount in $"
                  aria-label="Refund amount in dollars"
                  value={customDollars}
                  onChange={(event) => setCustomDollars(event.target.value)}
                  className="w-40 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              )}
              {customInvalid && (
                <p className="text-xs text-red-700">Enter an amount between $0 and {money(totalPriceCents)}.</p>
              )}
            </fieldset>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy || customInvalid}
              className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              {busy ? "Cancelling…" : isPaid ? "Cancel and refund" : paymentLink ? "Cancel link" : "Release hold"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600"
            >
              Keep booking
            </button>
          </div>
        </div>
      )}
      {message && (
        <p role="status" className={`text-sm ${message.type === "error" ? "text-red-700" : "text-emerald-700"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
