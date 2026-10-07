// Stripe webhook: POST /api/stripe
import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendBookingConfirmation } from '@/lib/email/sendBookingConfirmation';
import { sendHostNotification } from '@/lib/email/sendHostNotification';
import { sendGuestRefundIssued } from '@/lib/email/sendGuestRefundIssued';
import { sendHostRefundAdjustment } from '@/lib/email/sendHostRefundAdjustment';
import Stripe from 'stripe';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { sendEmail } from '@/lib/email/sendEmail';
import {
  blockBookingNights,
  isRangeAvailable,
  releaseBookingNights,
  withPropertyLock,
} from '@/lib/bookingAvailability';
import { OPS_ALERT_EMAIL } from '@/lib/contact';
import { escapeHtml } from '@/lib/html';
import { sendDoorCodeIfDue } from '@/lib/email/doorCodeDelivery';
import { syncAirbnbCalendarIfStale } from '@/lib/icalSync';
import { formatCurrencyFromCents, formatStayDates } from '@/lib/email/helpers';

export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook misconfigured' }, { status: 500 });
  }

  if (!sig) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let stripeClient: Stripe;

  try {
    stripeClient = getStripeClient();
  } catch (err) {
    console.error('Stripe client misconfigured', err);
    return NextResponse.json({ error: 'Stripe misconfigured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    // IMPORTANT: use raw text body for Stripe signature verification
    const rawBody = await req.text();
    event = stripeClient.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    // Usually scanners or a wrong secret; no stack needed.
    console.warn('Rejected Stripe webhook:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentIntentId = paymentIntent.id;

      const booking = await prisma.booking.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!booking) {
        console.warn('No booking found for PaymentIntent', paymentIntentId);
        // That's fine — might be a test event not linked to any booking
        return NextResponse.json({ received: true });
      }

      if (paymentIntent.amount_received !== booking.totalPriceCents) {
        // The booking is still confirmed (the guest has paid), but someone should look at it.
        console.error(
          `Stripe amount mismatch for booking ${booking.id}: received ${paymentIntent.amount_received}, expected ${booking.totalPriceCents}`
        );
        try {
          await sendEmail({
            to: OPS_ALERT_EMAIL,
            subject: `Check booking ${booking.publicReference ?? booking.id}: Stripe amount doesn't match`,
            html:
              `<p>Stripe received ${formatCurrencyFromCents(paymentIntent.amount_received)} for booking ` +
              `${escapeHtml(booking.publicReference ?? String(booking.id))}, but the booking total is ` +
              `${formatCurrencyFromCents(booking.totalPriceCents)}. The booking was confirmed as normal. ` +
              `Compare the payment in Stripe (${escapeHtml(paymentIntentId)}) with the booking in Admin → Bookings.</p>`,
          });
        } catch (alertError) {
          console.error('Failed to send amount mismatch alert', alertError);
        }
      }

      // Re-read Airbnb (if not synced in the last minute) so a reservation made there while the
      // guest was paying is seen before we confirm. Never throws; on failure we use the last import.
      const bookingProperty = await prisma.property.findUnique({
        where: { id: booking.propertyId },
        select: { id: true, slug: true, airbnbIcalUrl: true },
      });
      if (bookingProperty) {
        await syncAirbnbCalendarIfStale(bookingProperty, 60_000);
      }

      // 1) Confirm the booking under the property lock: only a PENDING booking whose dates
      //    are still free becomes PAID. Stripe retries are no-ops once it is PAID.
      const outcome = await withPropertyLock(booking.propertyId, async (tx) => {
        const current = await tx.booking.findUnique({ where: { id: booking.id } });
        if (!current || current.status === 'PAID') {
          return 'already-processed' as const;
        }
        const stillAvailable =
          current.status === 'PENDING' &&
          (await isRangeAvailable(
            current.propertyId,
            current.checkInDate,
            current.checkOutDate,
            // Only confirmed bookings and blocks count here, not other guests' unpaid holds or
            // payment links: money already taken beats a checkout that may never finish. If that
            // other guest pays later, their payment is refunded with an explanation (below).
            { excludeBookingIds: [current.id], includePendingHolds: false, includeLinkHolds: false },
            tx
          ));
        if (!stillAvailable) {
          await tx.booking.update({ where: { id: current.id }, data: { status: 'CANCELLED' } });
          return 'conflict' as const;
        }
        await tx.booking.update({ where: { id: current.id }, data: { status: 'PAID' } });
        // 2) Block dates for this booking (DIRECT source)
        await blockBookingNights(current, tx);
        return 'paid' as const;
      });

      if (outcome === 'already-processed') {
        return NextResponse.json({ received: true });
      }

      if (outcome === 'conflict') {
        console.error(`Booking ${booking.id} paid after its dates became unavailable; refunding.`);
        let refundError: unknown = null;
        try {
          await stripeClient.refunds.create(
            { payment_intent: paymentIntentId, reason: 'duplicate' },
            { idempotencyKey: `conflict-refund-${booking.id}` }
          );
        } catch (error) {
          refundError = error;
          console.error(`Automatic refund failed for booking ${booking.id}`, error);
        }
        const property = await prisma.property.findUnique({ where: { id: booking.propertyId } });
        const alertTo = property?.hostSupportEmail || OPS_ALERT_EMAIL;
        const reference = booking.publicReference ?? booking.id;
        const stay =
          `${escapeHtml(booking.guestName)} (${escapeHtml(booking.guestEmail)}) paid for ${escapeHtml(property?.name ?? 'a property')} ` +
          `${booking.checkInDate.toISOString().slice(0, 10)} → ${booking.checkOutDate.toISOString().slice(0, 10)}, ` +
          `but those dates were no longer available when the payment completed.`;
        try {
          await sendEmail({
            to: alertTo,
            subject: refundError
              ? `Urgent: booking ${reference} paid for unavailable dates, and the automatic refund failed`
              : `Action needed: booking ${reference} refunded (dates unavailable)`,
            html: refundError
              ? `<p>${stay} The automatic refund failed: ${escapeHtml(refundError instanceof Error ? refundError.message : String(refundError))}. ` +
                `Stripe will retry, and you'll get another email each time it fails. If this keeps happening, refund ` +
                `${escapeHtml(paymentIntentId)} in Stripe yourself and contact the guest.</p>`
              : `<p>${stay} The payment was refunded automatically. Please contact the guest.</p>`,
          });
        } catch (alertError) {
          console.error('Failed to send booking conflict alert', alertError);
        }
        // Stripe retries the webhook; the refund's idempotency key makes the retry safe.
        if (refundError) throw refundError;
        try {
          await sendEmail({
            to: booking.guestEmail,
            subject: `We couldn't complete your booking${property?.name ? ` at ${property.name}` : ''}`,
            html:
              `<p>Hi ${escapeHtml(booking.guestName)},</p>` +
              `<p>We're sorry: the dates you chose (${formatStayDates(booking.checkInDate, booking.checkOutDate)}) ` +
              `were booked by someone else while your payment was going through, so we couldn't confirm your stay.</p>` +
              `<p>Your payment of ${formatCurrencyFromCents(booking.totalPriceCents)} has been refunded in full. ` +
              `It usually appears on your statement within 5–10 business days.</p>` +
              `<p>Reply to this email and we'll help you find other dates.</p>`,
          });
        } catch (guestError) {
          console.error('Failed to send booking conflict email to guest', guestError);
        }
        return NextResponse.json({ received: true });
      }

      console.log(`✅ Booking ${booking.id} marked PAID and dates blocked`);

      // The booking is already PAID; a failed flag read must not stop the confirmation emails.
      const automatedEmailsEnabled = await isFeatureEnabled('automatedEmails').catch(() => true);

      // The guest's confirmation is also their receipt, so it always goes out.
      try {
        await sendBookingConfirmation(booking.id);
      } catch (err) {
        console.error('Failed to send booking confirmation email', err);
      }

      if (automatedEmailsEnabled) {
        try {
          await sendHostNotification(booking.id);
        } catch (err) {
          console.error('Failed to send host notification email', err);
        }
      } else {
        console.info('Automated emails disabled; skipping host notification.');
      }

      // Last-minute stays: send the door code now rather than at tomorrow's cron run.
      try {
        const paidBooking = await prisma.booking.findUnique({ where: { id: booking.id }, include: { property: true } });
        if (paidBooking) await sendDoorCodeIfDue(paidBooking);
      } catch (err) {
        console.error('Failed to send door code email', err);
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : (charge.payment_intent as Stripe.PaymentIntent)?.id;

      if (paymentIntentId) {
        const booking = await prisma.booking.findUnique({
          where: { stripePaymentIntentId: paymentIntentId },
          include: { property: true },
        });

        if (booking) {
          const amount = charge.amount_refunded; // cents
          const currency = charge.currency.toUpperCase();
          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
          });
          const formattedTotal = formatter.format(amount / 100);

          console.log(`💸 Refund detected for booking ${booking.id}: ${formattedTotal}`);

          // Refunds from an admin cancel or a booking conflict arrive for bookings we already
          // CANCELLED; those flows email the guest and host themselves.
          const alreadyCancelled = booking.status === 'CANCELLED';

          // A full refund cancels the stay and frees its dates.
          if (charge.refunded && !alreadyCancelled) {
            await prisma.$transaction(async (tx) => {
              await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
              await releaseBookingNights(booking, tx);
            });
          }

          if (alreadyCancelled) {
            return NextResponse.json({ received: true });
          }

          try {
            await sendGuestRefundIssued(booking.id, { refundCents: amount, bookingCancelled: charge.refunded });
            console.log(`✅ Sent refund email to guest for booking ${booking.id}`);

            // Notify Host/Ops about the adjustment
            try {
              await sendHostRefundAdjustment({ bookingId: booking.id, refundCents: amount, bookingCancelled: charge.refunded });
              console.log(`✅ Sent host refund adjustment email for booking ${booking.id}`);
            } catch (hostEmailError) {
              console.error('Failed to send host refund adjustment email', hostEmailError);
            }

          } catch (err) {
            console.error('Failed to send refund emails', err);
          }
        } else {
          console.warn(`Refund event for unknown booking PaymentIntent: ${paymentIntentId}`);
        }
      }
    }



    if (event.type === 'payment_intent.payment_failed') {
      // Declines happen while the guest is on the payment form, which shows the error and lets
      // them retry within their hold. No email: it would arrive mid-checkout with no way to pay.
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`❌ Payment attempt failed for PaymentIntent ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message ?? 'declined'}`);
    }

    // You can handle other event types here later

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }
}