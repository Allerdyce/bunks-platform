"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { PaymentSection } from "@/components/booking/PaymentSection";
import { SUPPORT_EMAIL } from "@/lib/contact";
import type { ChargeLine } from "@/lib/pricing/breakdown";

export type PaymentLinkViewState = "awaiting-payment" | "confirming" | "paid" | "expired" | "cancelled";

type PaymentLinkViewProps = {
  state: PaymentLinkViewState;
  clientSecret: string | null;
  propertyName: string;
  image: string | null;
  guestName: string;
  stayDates: string;
  lines: ChargeLine[];
  totalCents: number;
  holdUntil: string;
  reference: string | null;
};

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export function PaymentLinkView(props: PaymentLinkViewProps) {
  const router = useRouter();
  const [paid, setPaid] = useState(false);
  const state: PaymentLinkViewState = paid && props.state === "awaiting-payment" ? "confirming" : props.state;

  // The webhook confirms the booking a moment after payment; refresh until it shows as paid.
  useEffect(() => {
    if (state !== "confirming") return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [state, router]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
        Private booking{props.reference ? ` · Ref ${props.reference}` : ""}
      </p>
      <h1 className="page-title mt-2">{props.propertyName}</h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        {props.stayDates} · for {props.guestName}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)]">
        <section>
          {props.image && (
            <div className="relative mb-8 aspect-[3/2] overflow-hidden rounded-xl">
              <Image src={props.image} alt={props.propertyName} fill className="object-cover" sizes="(min-width: 1024px) 560px, 100vw" />
            </div>
          )}
          <dl className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {props.lines.map((line) => (
              <div key={line.label} className="flex justify-between gap-4 py-3">
                <dt>{line.label}</dt>
                <dd>{money(line.amountCents)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 py-3 font-semibold">
              <dt>Total (USD)</dt>
              <dd>{money(props.totalCents)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-white p-6">
          {state === "awaiting-payment" && (
            <>
              <h2 className="text-xl font-semibold">Pay to confirm</h2>
              <p className="mt-2 flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" /> We&apos;re holding these dates for you until {props.holdUntil}.
              </p>
              <div className="mt-6">
                {props.clientSecret ? (
                  <PaymentSection clientSecret={props.clientSecret} amountCents={props.totalCents} onSuccess={() => setPaid(true)} />
                ) : (
                  <p className="text-sm">Payment isn&apos;t available right now. Please email {SUPPORT_EMAIL}.</p>
                )}
              </div>
            </>
          )}
          {state === "confirming" && (
            <StateMessage icon title="Payment received">
              We&apos;re confirming your booking now. Your confirmation email is on its way.
            </StateMessage>
          )}
          {state === "paid" && (
            <StateMessage icon title="You're booked">
              This stay is paid and confirmed. Your confirmation email has the details, and you can find your trip under{" "}
              <a href="/my-trips" className="underline">My trips</a>.
            </StateMessage>
          )}
          {state === "expired" && (
            <StateMessage title="This link has expired">
              The dates were held until {props.holdUntil} and may now go to someone else. Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a> for a new link.
            </StateMessage>
          )}
          {state === "cancelled" && (
            <StateMessage title="This link is no longer active">
              Nothing has been charged. Email <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a> if
              you still want to book.
            </StateMessage>
          )}
        </section>
      </div>
    </main>
  );
}

function StateMessage({ icon, title, children }: { icon?: boolean; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        {icon && <CheckCircle2 className="h-5 w-5 text-emerald-600" />} {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{children}</p>
    </div>
  );
}
