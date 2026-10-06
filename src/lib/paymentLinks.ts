import "server-only";

import * as React from "react";
import { randomBytes, randomUUID } from "crypto";
import type { Booking, Property } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { isRangeAvailable, parseStayDate, toISODate, withPropertyLock } from "@/lib/bookingAvailability";
import { MAX_NIGHTS, propertyToday, resolvePropertyTimeZone } from "@/lib/stayRules";
import { syncAirbnbCalendarIfStale } from "@/lib/icalSync";
import { calculatePricing } from "@/lib/pricing/calculator";
import { PriceUnavailableError } from "@/lib/airbnbRates";
import {
  BOOKING_REFERENCE_INSERT_ATTEMPTS,
  generateUniqueBookingReference,
  isBookingReferenceCollision,
} from "@/lib/bookingReference";
import { sendEmail } from "@/lib/email/sendEmail";
import { firstNameOf, formatCurrencyFromCents, formatStayDates, resolveHostSupportEmail } from "@/lib/email/helpers";
import { renderEmail } from "@/lib/email/renderEmail";
import { bookingChargeLines } from "@/lib/pricing/breakdown";
import { PaymentLinkEmail } from "@/emails/PaymentLinkEmail";

// Private payment links (Admin → Bookings → New private booking): an admin prices a stay for one
// guest, with every fee editable (tax included), and Bunks holds the dates until holdUntil while
// the guest pays that exact amount at /pay/<token>. Once paid it's an ordinary booking, confirmed
// by the Stripe webhook like any checkout. An unpaid link stops holding its dates at holdUntil,
// and an admin can cancel it early with the booking's Cancel control.

export const DEFAULT_HOLD_HOURS = 48;
export const MAX_HOLD_HOURS = 24 * 7;
export const MAX_CHARGE_CENTS = 10_000_000; // $100,000 per line
const MIN_TOTAL_CENTS = 50; // Stripe's minimum charge
const DAY_MS = 86_400_000;

export type PaymentLinkCharges = {
  nightlySubtotalCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  taxCents: number;
};

export const chargesTotal = (charges: PaymentLinkCharges) =>
  charges.nightlySubtotalCents + charges.cleaningFeeCents + charges.serviceFeeCents + charges.taxCents;

export function paymentLinkUrl(token: string, origin?: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? origin ?? "https://www.bunks.com").replace(/\/+$/, "");
  return `${base}/pay/${token}`;
}

export type PaymentLinkState = "awaiting-payment" | "expired" | "paid" | "cancelled";

export function paymentLinkState(booking: Pick<Booking, "status" | "holdUntil">, now = new Date()): PaymentLinkState {
  if (booking.status === "PAID") return "paid";
  if (booking.status === "CANCELLED") return "cancelled";
  return booking.holdUntil && booking.holdUntil > now ? "awaiting-payment" : "expired";
}

/** The standard price for a stay, to pre-fill the admin form; null when the rates can't price it. */
export async function suggestedCharges(
  slug: string,
  checkIn: Date,
  checkOut: Date,
  guests: number,
): Promise<PaymentLinkCharges | null> {
  try {
    const quote = await calculatePricing(slug, checkIn, checkOut, guests);
    return {
      nightlySubtotalCents: quote.nightlySubtotalCents,
      cleaningFeeCents: quote.cleaningFeeCents,
      serviceFeeCents: quote.serviceFeeCents,
      taxCents: quote.taxCents,
    };
  } catch (error) {
    if (error instanceof PriceUnavailableError) return null;
    throw error;
  }
}

export class PaymentLinkError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "PaymentLinkError";
  }
}

export type CreatePaymentLinkInput = {
  propertyId: number;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guests: number;
  holdHours: number;
  charges: PaymentLinkCharges;
};

/**
 * Holds the dates and creates the Stripe payment for an admin-priced stay. Fails if any night is
 * booked, blocked or held (Airbnb is re-read first). Returns a warning when Airbnb couldn't be read.
 */
export async function createPaymentLink(input: CreatePaymentLinkInput, adminEmail: string) {
  const property = await prisma.property.findUnique({ where: { id: input.propertyId } });
  if (!property) throw new PaymentLinkError("Home not found.", 404);

  const checkIn = parseStayDate(input.checkIn);
  const checkOut = parseStayDate(input.checkOut);
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    throw new PaymentLinkError("Choose a check-in date and a later check-out date.");
  }
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
  if (nights > MAX_NIGHTS) throw new PaymentLinkError(`A payment link can cover at most ${MAX_NIGHTS} nights.`);
  if (checkIn < propertyToday(resolvePropertyTimeZone(property))) {
    throw new PaymentLinkError("Check-in can't be in the past.");
  }
  if (property.maxGuests && input.guests > property.maxGuests) {
    throw new PaymentLinkError(`${property.name} sleeps ${property.maxGuests}.`);
  }
  if (input.charges.nightlySubtotalCents <= 0) throw new PaymentLinkError("Enter the price for the nights.");
  const totalPriceCents = chargesTotal(input.charges);
  if (totalPriceCents < MIN_TOTAL_CENTS) throw new PaymentLinkError("The total must be at least $0.50.");

  // Read Airbnb first so the hold can't land on nights Airbnb just sold. A failed read doesn't stop
  // an admin, who may know better, but they're told.
  const sync = await syncAirbnbCalendarIfStale(property, 2 * 60_000, { retryImmediately: true });
  const warning =
    sync === "failed" ? "Couldn't read the Airbnb calendar just now, so check Airbnb for these dates." : undefined;

  const holdUntil = new Date(Date.now() + input.holdHours * 3_600_000);
  const paymentLinkToken = randomBytes(24).toString("base64url");
  let booking: Booking | null = null;
  for (let attempt = 0; attempt < BOOKING_REFERENCE_INSERT_ATTEMPTS && !booking; attempt += 1) {
    const publicReference = await generateUniqueBookingReference();
    try {
      booking = await withPropertyLock(property.id, async (tx) => {
        if (!(await isRangeAvailable(property.id, checkIn, checkOut, {}, tx))) {
          throw new PaymentLinkError("Some of those nights are already booked, blocked or held.", 409);
        }
        return tx.booking.create({
          data: {
            propertyId: property.id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            guestName: input.guestName,
            guestEmail: input.guestEmail,
            guestCount: input.guests,
            totalPriceCents,
            ...input.charges,
            status: "PENDING",
            holdUntil,
            paymentLinkToken,
            createdByAdmin: adminEmail,
            // Unique placeholder until the PaymentIntent exists.
            stripePaymentIntentId: `pending_${randomUUID()}`,
            publicReference,
          },
        });
      });
    } catch (error) {
      if (isBookingReferenceCollision(error)) continue;
      throw error;
    }
  }
  if (!booking) throw new Error("Couldn't create a unique booking reference.");

  try {
    const intent = await getStripeClient().paymentIntents.create(
      {
        amount: totalPriceCents,
        currency: "usd",
        // Cards only (Apple Pay / Google Pay are cards), as at checkout.
        payment_method_types: ["card"],
        // No receipt_email: the guest's Bunks confirmation is their receipt.
        description: `${property.name}, ${toISODate(checkIn)} to ${toISODate(checkOut)} (private booking ${booking.publicReference})`,
        metadata: {
          bookingId: booking.id.toString(),
          propertySlug: property.slug,
          checkIn: toISODate(checkIn),
          checkOut: toISODate(checkOut),
          guests: input.guests.toString(),
          booking_reference: booking.publicReference ?? "",
          source: "payment_link",
        },
      },
      { idempotencyKey: `payment-link-${booking.id}` },
    );
    booking = await prisma.booking.update({ where: { id: booking.id }, data: { stripePaymentIntentId: intent.id } });
  } catch (error) {
    // Release the hold so the dates aren't blocked by a link that can't be paid.
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } }).catch(() => undefined);
    throw error;
  }
  return { booking, property, warning };
}

/** The booking behind a /pay link, or null for an unknown token. */
export async function findPaymentLink(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  return prisma.booking.findUnique({ where: { paymentLinkToken: token }, include: { property: true } });
}

/** When the link stops holding the dates, in the home's time zone. */
export const holdUntilLabel = (booking: Booking, property: Property) =>
  booking.holdUntil
    ? booking.holdUntil.toLocaleString("en-US", {
        timeZone: resolvePropertyTimeZone(property),
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "";

/** Emails the guest their payment link (admin-triggered). */
export async function sendPaymentLinkEmail(booking: Booking & { property: Property }, origin?: string) {
  if (!booking.paymentLinkToken || paymentLinkState(booking) !== "awaiting-payment") {
    throw new PaymentLinkError("This link isn't awaiting payment any more.", 409);
  }
  const url = paymentLinkUrl(booking.paymentLinkToken, origin);
  const lines = (await bookingChargeLines(booking)) ?? [];
  const html = await renderEmail(
    React.createElement(PaymentLinkEmail, {
      guestFirstName: firstNameOf(booking.guestName),
      propertyName: booking.property.name,
      stayDates: formatStayDates(booking.checkInDate, booking.checkOutDate),
      chargeLines: lines.map((line) => ({ label: line.label, amount: formatCurrencyFromCents(line.amountCents) })),
      total: formatCurrencyFromCents(booking.totalPriceCents),
      payUrl: url,
      holdUntil: holdUntilLabel(booking, booking.property),
      supportEmail: resolveHostSupportEmail(booking),
    }),
  );
  await sendEmail({
    to: booking.guestEmail,
    replyTo: resolveHostSupportEmail(booking),
    subject: `Your private booking for ${booking.property.name}`,
    html,
  });
  return url;
}

