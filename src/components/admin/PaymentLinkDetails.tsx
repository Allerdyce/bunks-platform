"use client";

import { useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";

export type AdminPaymentLink = {
  url: string;
  state: "awaiting-payment" | "expired" | "paid" | "cancelled";
  holdUntil: string;
  createdBy: string | null;
  charges: { nightlySubtotalCents: number; cleaningFeeCents: number; serviceFeeCents: number; taxCents: number };
};

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const STATE_TEXT: Record<AdminPaymentLink["state"], (holdUntil: string) => string> = {
  "awaiting-payment": (holdUntil) => `Waiting for the guest to pay. Dates held until ${holdUntil}.`,
  expired: (holdUntil) => `Expired ${holdUntil} without payment. The dates are open again.`,
  paid: () => "Paid through the private link.",
  cancelled: () => "Cancelled. The guest can't pay with this link.",
};

/** The private payment link behind an admin-priced booking: status, link and the fees set. */
export function PaymentLinkDetails({ bookingId, link }: { bookingId: number; link: AdminPaymentLink }) {
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const email = async () => {
    setEmailState("sending");
    setError(null);
    const res = await fetch(`/api/admin/payment-links/${bookingId}/email`, { method: "POST", credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      setEmailState("sent");
    } else {
      setEmailState("idle");
      setError(data.error ?? "Couldn't send the email.");
    }
  };

  const lines = [
    ["Nights", link.charges.nightlySubtotalCents],
    ["Cleaning fee", link.charges.cleaningFeeCents],
    ["Service fee", link.charges.serviceFeeCents],
    ["Tax", link.charges.taxCents],
  ] as const;

  return (
    <section className="space-y-3 border-t border-gray-100 pt-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Payment link</h3>
      <p className="text-sm text-gray-700">
        {STATE_TEXT[link.state](link.holdUntil)}
        {link.createdBy ? ` Created by ${link.createdBy}.` : ""}
      </p>
      {link.state === "awaiting-payment" && (
        <>
          <div className="flex gap-2">
            <input
              readOnly
              value={link.url}
              aria-label="Payment link"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={email}
            disabled={emailState !== "idle"}
            className="inline-flex items-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            {emailState === "sending" ? "Sending…" : emailState === "sent" ? "Emailed to the guest" : "Email link to guest"}
          </button>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </>
      )}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        {lines.map(([label, cents]) => (
          <div key={label}>
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-900">{money(cents)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
