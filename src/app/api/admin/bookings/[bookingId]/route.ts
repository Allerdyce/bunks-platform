import { NextRequest, NextResponse } from "next/server";
import type { EmailType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/adminAuth";
import { notAClaim } from "@/lib/email/claims";
import { bookingChargeLines } from "@/lib/pricing/breakdown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_LABELS: Partial<Record<EmailType, string>> = {
  BOOKING_CONFIRMATION: "Booking confirmation",
  RECEIPT: "Receipt (old)",
  BOOKING_WELCOME: "Welcome (old)",
  PRE_STAY_REMINDER: "2-day reminder (old)",
  PRE_STAY_REMINDER_24H: "24-hour reminder (old)",
  DOOR_CODE_DELIVERY: "Arrival details",
  CHECKOUT_REMINDER: "Checkout reminder",
  CANCELLATION_CONFIRMATION: "Cancellation",
  GUEST_REFUND_ISSUED: "Refund",
  HOST_NOTIFICATION: "New booking (to team)",
  HOST_GUEST_CANCELLED: "Cancelled (to team)",
  HOST_REFUND_ADJUSTMENT: "Refund (to team)",
};

// Stripe's dashboard path for this account's mode.
const stripeDashboardBase = () =>
  process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") || process.env.STRIPE_SECRET_KEY?.startsWith("rk_test")
    ? "https://dashboard.stripe.com/test/payments/"
    : "https://dashboard.stripe.com/payments/";

/** Admin → Bookings detail: the fee breakdown, emails sent and the Stripe payment. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  if (!withAdminAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) || -1 },
    include: {
      property: true,
      emailLogs: { where: notAClaim, orderBy: { sentAt: "asc" } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const chargeLines = await bookingChargeLines(booking);
  return NextResponse.json({
    chargeLines,
    emails: booking.emailLogs.map((log) => ({
      id: log.id,
      label: EMAIL_LABELS[log.type] ?? log.type.toLowerCase().replace(/_/g, " "),
      to: log.to,
      status: log.status,
      error: log.status === "FAILED" ? log.error : null,
      sentAt: log.sentAt.toISOString(),
    })),
    stripeUrl: booking.stripePaymentIntentId.startsWith("pi_")
      ? `${stripeDashboardBase()}${booking.stripePaymentIntentId}`
      : null,
  });
}
