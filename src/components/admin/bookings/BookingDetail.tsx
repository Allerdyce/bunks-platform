"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, Loader2 } from "lucide-react";
import { getPropertyBySlug } from "@/data/properties";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { CancelBookingControl } from "@/components/admin/CancelBookingControl";
import { PaymentLinkDetails } from "@/components/admin/PaymentLinkDetails";
import { formatMoney, STATUS_STYLE, type AdminBooking } from "./bookingDisplay";

type BookingExtras = {
  chargeLines: { label: string; amountCents: number }[] | null;
  emails: { id: number; label: string; to: string; status: string; error: string | null; sentAt: string }[];
  stripeUrl: string | null;
};

// Stay dates are calendar dates stored as UTC midnight; timestamps show in the viewer's zone.
const stayDate = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const timestamp = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-gray-100 pt-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{title}</h3>
      {children}
    </section>
  );
}

export function BookingDetail({ booking, onChanged }: { booking: AdminBooking; onChanged: () => void }) {
  const [extras, setExtras] = useState<BookingExtras | null>(null);
  const [extrasError, setExtrasError] = useState(false);
  const image = getPropertyBySlug(booking.property.slug)?.image ?? null;
  const status = STATUS_STYLE[booking.displayStatus];

  useEffect(() => {
    // The page remounts this per booking (key), so there's no stale state to clear here.
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, { credentials: "include" });
      const data = res.ok ? ((await res.json()) as BookingExtras) : null;
      if (cancelled) return;
      if (data) setExtras(data);
      else setExtrasError(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [booking.id, booking.status]);

  const bookedVia =
    booking.source === "link"
      ? `private payment link${booking.paymentLink?.createdBy ? ` from ${booking.paymentLink.createdBy}` : ""}`
      : "website checkout";

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 sm:p-10">
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{booking.property.name}</p>
          <h2 className="mt-2 font-serif text-3xl text-gray-900">{booking.guestName}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
              {booking.displayStatus === "cancelled" && booking.wasPaid ? "Cancelled after payment" : status.label}
            </span>
            {booking.referenceCode && <span className="text-gray-500">Ref {booking.referenceCode}</span>}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Booked {timestamp.format(new Date(booking.createdAt))} via {bookedVia}.
          </p>
        </div>
        {image && (
          <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded-xl sm:block">
            <Image src={image} alt={booking.property.name} fill className="object-cover" sizes="144px" />
          </div>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-5 sm:grid-cols-5">
        {[
          ["Check-in", stayDate.format(new Date(booking.checkInDate))],
          ["Check-out", stayDate.format(new Date(booking.checkOutDate))],
          ["Nights", String(booking.nights)],
          ["Guests", booking.guestCount ? String(booking.guestCount) : "—"],
          ["Total", formatMoney(booking.totalPriceCents)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-[0.15em] text-gray-500">{label}</dt>
            <dd className="mt-1 font-semibold text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>

      <Section title="Payment">
        {!extras && !extrasError ? (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : (
          <>
            <dl className="divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm">
              {(extras?.chargeLines ?? []).map((line) => (
                <div key={line.label} className="flex justify-between gap-4 px-4 py-2">
                  <dt className="text-gray-600">{line.label}</dt>
                  <dd className="font-medium text-gray-900">{formatMoney(line.amountCents)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 px-4 py-2 font-semibold text-gray-900">
                <dt>{booking.wasPaid ? "Total paid" : "Total"}</dt>
                <dd>{formatMoney(booking.totalPriceCents)}</dd>
              </div>
            </dl>
            {extras && !extras.chargeLines && (
              <p className="text-xs text-gray-500">The fee breakdown isn&apos;t available: rates changed after this booking.</p>
            )}
            {extras?.stripeUrl && (booking.wasPaid || booking.status === "PENDING") && (
              <a
                href={extras.stripeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 underline"
              >
                View in Stripe <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </>
        )}
      </Section>

      {booking.paymentLink && (
        <PaymentLinkDetails key={booking.id} bookingId={booking.id} link={booking.paymentLink} wasPaid={booking.wasPaid} />
      )}

      <Section title="Guest">
        <p className="text-gray-900">
          {booking.guestName} ·{" "}
          <a href={`mailto:${booking.guestEmail}`} className="underline">
            {booking.guestEmail}
          </a>
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`mailto:${booking.guestEmail}?subject=${encodeURIComponent(`Your stay at ${booking.property.name} (${booking.referenceCode ?? booking.id})`)}`}
            className="inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Email guest
          </a>
          {booking.referenceCode && booking.status === "PAID" && (
            <a
              href={`/my-trips/${booking.referenceCode}/essential`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Guest&apos;s trip page
            </a>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Guest replies to booking emails go to {booking.property.hostSupportEmail ?? SUPPORT_EMAIL}.
        </p>
      </Section>

      <Section title="Emails sent">
        {!extras ? (
          <p className="text-sm text-gray-500">{extrasError ? "Couldn't load the email history." : "Loading…"}</p>
        ) : extras.emails.length ? (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm">
            {extras.emails.map((email) => (
              <li key={email.id} className="flex items-start justify-between gap-4 px-4 py-2">
                <span>
                  <span className="font-medium text-gray-900">{email.label}</span>
                  <span className="block text-xs text-gray-500">to {email.to}</span>
                  {email.error && <span className="block text-xs text-red-600">Failed: {email.error}</span>}
                </span>
                <span className={`shrink-0 text-xs ${email.status === "FAILED" ? "text-red-600" : "text-gray-500"}`}>
                  {email.status === "FAILED" ? "Failed · " : ""}
                  {timestamp.format(new Date(email.sentAt))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No emails sent for this booking yet.</p>
        )}
      </Section>

      <Section title="Cancellation">
        <CancelBookingControl
          key={booking.id}
          bookingId={booking.id}
          status={booking.status}
          totalPriceCents={booking.totalPriceCents}
          checkInDate={booking.checkInDate}
          paymentLink={Boolean(booking.paymentLink)}
          onCancelled={onChanged}
        />
      </Section>
    </div>
  );
}
