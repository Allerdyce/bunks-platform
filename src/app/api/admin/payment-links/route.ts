import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/lib/adminAuth";
import {
  createPaymentLink,
  DEFAULT_HOLD_HOURS,
  MAX_CHARGE_CENTS,
  MAX_HOLD_HOURS,
  PaymentLinkError,
  paymentLinkUrl,
} from "@/lib/paymentLinks";

export const runtime = "nodejs";

const cents = z.number({ error: "Amounts must be numbers." }).int("Amounts must be whole cents.").min(0, "Amounts can't be negative.").max(MAX_CHARGE_CENTS, "That amount is too large.");
const EMAIL_MESSAGE = "Enter a valid guest email.";
const createSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  checkIn: z.string().trim().min(1).max(40),
  checkOut: z.string().trim().min(1).max(40),
  guestName: z.string({ error: "Enter the guest's name." }).trim().min(1, "Enter the guest's name.").max(120, "Name is too long."),
  guestEmail: z.string({ error: EMAIL_MESSAGE }).trim().toLowerCase().max(254, EMAIL_MESSAGE).pipe(z.email(EMAIL_MESSAGE)),
  guests: z.coerce.number().int().min(1, "At least 1 guest.").max(50),
  holdHours: z.coerce.number().int().min(1).max(MAX_HOLD_HOURS).default(DEFAULT_HOLD_HOURS),
  charges: z.object({
    nightlySubtotalCents: cents,
    cleaningFeeCents: cents,
    serviceFeeCents: cents,
    taxCents: cents,
  }),
});

/** Creates a private payment link: holds the dates and the Stripe payment for the admin's price. */
export async function POST(request: NextRequest) {
  const session = withAdminAuth(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  try {
    const { booking, warning } = await createPaymentLink(parsed.data, session.email);
    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      reference: booking.publicReference,
      url: paymentLinkUrl(booking.paymentLinkToken!, request.nextUrl.origin),
      holdUntil: booking.holdUntil?.toISOString(),
      totalPriceCents: booking.totalPriceCents,
      warning,
    });
  } catch (error) {
    if (error instanceof PaymentLinkError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[payment-links] create failed", error);
    return NextResponse.json({ error: "Couldn't create the payment link. Nothing was held." }, { status: 500 });
  }
}
