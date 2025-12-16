
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionFromRequest } from "@/lib/adminAuth";
import { sendCancellationConfirmation } from "@/lib/email/sendCancellationConfirmation";
import { sendHostGuestCancelled } from "@/lib/email/sendHostGuestCancelled";

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

            // Clear blocked dates
            // Source: DIRECT (since Airbnb blocks are managed by sync, usually we only clear DIRECT ones for our bookings)
            // Logic: Find BlockedDate entries for this property in range
            // But BlockedDate doesn't link to Booking explicitly (only by loose range).
            // However, our `api / stripe / route.ts` creates them with source 'DIRECT'.
            // We should remove them.
            // Range: checkIn to checkOut.

            const checkIn = booking.checkInDate;
            const checkOut = booking.checkOutDate;

            await tx.blockedDate.deleteMany({
                where: {
                    propertyId: booking.propertyId,
                    source: "DIRECT",
                    date: {
                        gte: checkIn,
                        lt: checkOut,
                    },
                },
            });
        });

        // 3. Send Emails (Fire and forget or await?)
        // Better to await to report errors, but don't fail the request if email fails?
        // We'll await and log errors.

        // Guest Email
        try {
            await sendCancellationConfirmation(booking.id, {
                cancellationInitiator: "Host/Admin",
                refundTotal: "See Refund Policy",
                refundMethod: "Original Payment Method",
                refundTimeline: "5-10 business days",
                refundLineItems: [{ label: "Refund", amount: "See Policy" }],
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
                    guestRefund: "Pending",
                    hostPayoutChange: "Pending",
                    retention: "Pending"
                },
                lineItems: [{ label: "Cancellation", amount: "N/A", type: "charge" }],
            });
        } catch (e) {
            console.error("Failed to send host cancellation email", e);
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error("Cancellation error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
