
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionFromRequest } from "@/lib/adminAuth";
import { sendCancellationConfirmation } from "@/lib/email/sendCancellationConfirmation";
import { sendHostGuestCancelled } from "@/lib/email/sendHostGuestCancelled";
import { getStripeClient } from "@/lib/stripe";
import { releaseBookingNights } from "@/lib/bookingAvailability";
import { formatStayDates, resolveHostSupportEmail } from "@/lib/email/helpers";
import { resolvePropertyTimeZone } from "@/lib/stayRules";

export const runtime = "nodejs";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
) {
    // 1. Verify Admin Auth
    const session = readSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { bookingId: id } = await params;
        const bookingId = parseInt(id, 10);

        if (isNaN(bookingId)) {
            return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { property: true },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (booking.status === "CANCELLED") {
            return NextResponse.json({ error: "Booking already cancelled" }, { status: 400 });
        }

        // Refund: "full" (default, e.g. host cancels), "none", or an amount in cents.
        const body = (await request.json().catch(() => ({}))) as { refund?: "full" | "none" | number };
        const refundRequest = body.refund ?? "full";
        // Reject anything that isn't "full", "none" or a whole number of cents, rather than
        // cancelling with a silent $0 refund on a typo.
        if (
            refundRequest !== "full" &&
            refundRequest !== "none" &&
            !(typeof refundRequest === "number" && Number.isInteger(refundRequest) && refundRequest >= 0)
        ) {
            return NextResponse.json(
                { error: 'Refund must be "full", "none" or an amount in cents.' },
                { status: 400 }
            );
        }
        let refundCents = 0;
        if (booking.status === "PAID" && booking.stripePaymentIntentId.startsWith("pi_")) {
            refundCents =
                refundRequest === "full"
                    ? booking.totalPriceCents
                    : refundRequest === "none"
                        ? 0
                        : Math.min(refundRequest, booking.totalPriceCents);
        }

        if (refundCents > 0) {
            // Refund before cancelling so a Stripe failure leaves the booking untouched.
            await getStripeClient().refunds.create(
                { payment_intent: booking.stripePaymentIntentId, amount: refundCents },
                { idempotencyKey: `cancel-refund-${booking.id}-${refundCents}` }
            );
        } else if (booking.status === "PENDING" && booking.stripePaymentIntentId.startsWith("pi_")) {
            // The guest may have just paid (webhook not processed yet): never release a paid hold.
            const stripe = getStripeClient();
            const intent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
            if (intent.status === "succeeded" || intent.status === "processing") {
                return NextResponse.json(
                    { error: "This guest's payment has just gone through. Refresh in a minute; it will show as Paid." },
                    { status: 409 }
                );
            }
            if (intent.status !== "canceled") {
                await stripe.paymentIntents.cancel(booking.stripePaymentIntentId);
            }
        }
        const refundLabel = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(refundCents / 100);

        // Cancel only if the status hasn't changed since we read it (e.g. a payment landing mid-cancel).
        const cancelled = await prisma.$transaction(async (tx) => {
            const { count } = await tx.booking.updateMany({
                where: { id: booking.id, status: booking.status },
                data: { status: "CANCELLED" },
            });
            if (count === 0) return false;
            await releaseBookingNights(booking, tx);
            return true;
        });
        if (!cancelled) {
            const latest = await prisma.booking.findUnique({ where: { id: booking.id }, select: { status: true } });
            if (refundCents > 0 && latest?.status === "CANCELLED") {
                // The refund's own webhook cancelled it first (and emailed the guest about the refund).
                return NextResponse.json({ ok: true, refundCents });
            }
            return NextResponse.json(
                { error: "This booking just changed (it may have been paid). Refresh and try again." },
                { status: 409 }
            );
        }

        // An abandoned checkout (never paid) is just released; there's nothing to tell the guest or host.
        if (booking.status === "PAID") {
            try {
                await sendCancellationConfirmation(booking.id, {
                    cancellationInitiator: "Host/Admin",
                    refundTotal: refundLabel,
                    refundMethod: "Original Payment Method",
                    refundTimeline: refundCents > 0 ? "5-10 business days" : "No refund issued",
                    refundLineItems: [{ label: "Refund", amount: refundLabel }],
                });
            } catch (e) {
                console.error("Failed to send guest cancellation email", e);
            }

            try {
                await sendHostGuestCancelled({
                    to: resolveHostSupportEmail(booking),
                    bookingId: booking.id,
                    hostName: "Host",
                    guestName: booking.guestName,
                    propertyName: booking.property.name,
                    stayDates: formatStayDates(booking.checkInDate, booking.checkOutDate),
                    cancelledAt: new Date().toLocaleString("en-US", {
                        timeZone: resolvePropertyTimeZone(booking.property),
                        timeZoneName: "short",
                    }),
                    policyApplied: "Host Cancelled",
                    refundSummary: {
                        guestRefund: refundLabel,
                        hostPayoutChange: "Pending",
                        retention: "Pending"
                    },
                    lineItems: [{ label: "Cancellation", amount: "N/A", type: "charge" }],
                });
            } catch (e) {
                console.error("Failed to send host cancellation email", e);
            }
        }

        return NextResponse.json({ ok: true, refundCents });

    } catch (error) {
        console.error("Cancellation error:", error);
        return NextResponse.json({ error: "Cancellation failed" }, { status: 500 });
    }
}
