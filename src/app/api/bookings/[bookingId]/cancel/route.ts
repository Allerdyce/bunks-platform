
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionFromRequest } from "@/lib/adminAuth";
import { sendCancellationConfirmation } from "@/lib/email/sendCancellationConfirmation";
import { sendHostGuestCancelled } from "@/lib/email/sendHostGuestCancelled";
import { PriceLabsService } from "@/lib/pricelabs/service";
import { getStripeClient } from "@/lib/stripe";
import { releaseBookingNights } from "@/lib/bookingAvailability";

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
        let refundCents = 0;
        if (booking.status === "PAID" && booking.stripePaymentIntentId.startsWith("pi_")) {
            refundCents =
                refundRequest === "full"
                    ? booking.totalPriceCents
                    : refundRequest === "none"
                        ? 0
                        : Math.max(0, Math.min(Math.round(Number(refundRequest)), booking.totalPriceCents));
        }

        if (refundCents > 0) {
            // Refund before cancelling so a Stripe failure leaves the booking untouched.
            await getStripeClient().refunds.create(
                { payment_intent: booking.stripePaymentIntentId, amount: refundCents },
                { idempotencyKey: `cancel-refund-${booking.id}-${refundCents}` }
            );
        } else if (booking.status === "PENDING" && booking.stripePaymentIntentId.startsWith("pi_")) {
            await getStripeClient().paymentIntents.cancel(booking.stripePaymentIntentId).catch(() => undefined);
        }
        const refundLabel = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(refundCents / 100);

        // 2. Cancellation Logic
        /*
           - Update Status
           - Clear blocked dates
        */

        // Start transaction
        await prisma.$transaction(async (tx) => {
            // Update status
            await tx.booking.update({
                where: { id: booking.id },
                data: { status: "CANCELLED" },
            });

            await releaseBookingNights(booking, tx);
        });

        // PriceLabs Sync
        try {
            // Need to update reservation status (Canceled)
            // But we modified booking inside transaction. The `booking` variable is STALE (has old status).
            // However, `syncReservation` takes a Booking object.
            // We should manually patch the object or fetch again, or better:
            // SyncService likely just needs the ID for some things, but `syncReservation` uses the object fields.
            // Let's manually set status on the object we pass.

            const updatedBooking = { ...booking, status: "CANCELLED" as const };
            await PriceLabsService.syncReservation(updatedBooking);

            // Update calendar availability (dates open up)
            await PriceLabsService.syncCalendar(booking.propertyId);
        } catch (plError) {
            console.error('Failed to sync cancellation to PriceLabs', plError);
        }

        // 3. Send Emails (Fire and forget or await?)
        // Better to await to report errors, but don't fail the request if email fails?
        // We'll await and log errors.

        // Guest Email
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

        // Host Email
        try {
            await sendHostGuestCancelled({
                bookingId: booking.id,
                hostName: "Host",
                guestName: booking.guestName,
                propertyName: booking.property.name,
                stayDates: `${booking.checkInDate.toLocaleDateString("en-US")} - ${booking.checkOutDate.toLocaleDateString("en-US")} `,
                cancelledAt: new Date().toLocaleString(),
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

        return NextResponse.json({ ok: true, refundCents });

    } catch (error) {
        console.error("Cancellation error:", error);
        return NextResponse.json({ error: "Cancellation failed" }, { status: 500 });
    }
}
