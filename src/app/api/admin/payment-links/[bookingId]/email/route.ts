import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { PaymentLinkError, sendPaymentLinkEmail } from "@/lib/paymentLinks";

export const runtime = "nodejs";

/** Emails the guest their payment link. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  if (!withAdminAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) || -1 },
    include: { property: true },
  });
  if (!booking?.paymentLinkToken) return NextResponse.json({ error: "Payment link not found." }, { status: 404 });

  try {
    await sendPaymentLinkEmail(booking, request.nextUrl.origin);
    return NextResponse.json({ ok: true, sentTo: booking.guestEmail });
  } catch (error) {
    if (error instanceof PaymentLinkError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[payment-links] email failed", error);
    return NextResponse.json({ error: "Couldn't send the email. Copy the link and send it yourself." }, { status: 502 });
  }
}
