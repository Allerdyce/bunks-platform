import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StandaloneLayout } from "@/components/layout/StandaloneLayout";
import { PaymentLinkView, type PaymentLinkViewState } from "@/components/booking/PaymentLinkView";
import { PROPERTIES } from "@/data/properties";
import { bookingChargeLines } from "@/lib/pricing/breakdown";
import { formatStayDates } from "@/lib/email/helpers";
import { findPaymentLink, holdUntilLabel, paymentLinkState } from "@/lib/paymentLinks";
import { getStripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your private booking",
  robots: { index: false, follow: false },
};

// A guest's private payment link (see lib/paymentLinks). The token in the URL is the only key.
export default async function PaymentLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await findPaymentLink(token);
  if (!booking) notFound();

  let state: PaymentLinkViewState = paymentLinkState(booking);
  let clientSecret: string | null = null;
  if (state === "awaiting-payment" && booking.stripePaymentIntentId.startsWith("pi_")) {
    const intent = await getStripeClient().paymentIntents.retrieve(booking.stripePaymentIntentId);
    // Paid, but the webhook hasn't confirmed the booking yet.
    if (intent.status === "succeeded" || intent.status === "processing") state = "confirming";
    else if (intent.status === "canceled") state = "cancelled";
    else clientSecret = intent.client_secret;
  }

  const lines = (await bookingChargeLines(booking)) ?? [];
  return (
    <StandaloneLayout>
      <PaymentLinkView
        state={state}
        clientSecret={clientSecret}
        propertyName={booking.property.name}
        image={PROPERTIES.find((property) => property.slug === booking.property.slug)?.image ?? null}
        guestName={booking.guestName}
        guestEmail={booking.guestEmail}
        stayDates={formatStayDates(booking.checkInDate, booking.checkOutDate)}
        lines={lines}
        totalCents={booking.totalPriceCents}
        holdUntil={holdUntilLabel(booking, booking.property)}
        reference={booking.publicReference}
      />
    </StandaloneLayout>
  );
}
