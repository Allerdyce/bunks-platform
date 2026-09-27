// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendReceiptEmail } from '@/lib/email/sendReceiptEmail';
import { sendBookingWelcomeEmail } from '@/lib/email/sendBookingWelcomeEmail';
import { sendBookingConfirmation } from '@/lib/email/sendBookingConfirmation';
import { sendHostNotification } from '@/lib/email/sendHostNotification';
import { sendGuestRefundIssued } from '@/lib/email/sendGuestRefundIssued';
import { sendHostRefundAdjustment } from '@/lib/email/sendHostRefundAdjustment';
import { sendPaymentFailure } from '@/lib/email/sendPaymentFailure';
import Stripe from 'stripe';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { sendEmail } from '@/lib/email/sendEmail';
import {
  blockBookingNights,
  isRangeAvailable,
  releaseBookingNights,
  withPropertyLock,
} from '@/lib/bookingAvailability';

export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type PaymentIntentWithCharges = Stripe.PaymentIntent & {
  charges?: Stripe.ApiList<Stripe.Charge>;
};

function describePaymentMethod(paymentIntent: Stripe.PaymentIntent) {
  const charge = (paymentIntent as PaymentIntentWithCharges).charges?.data?.[0];
  if (!charge?.payment_method_details) {
    return undefined;
  }

  const details = charge.payment_method_details;

  if (details.card) {
    const brand = details.card.brand ? capitalize(details.card.brand.replace(/_/g, ' ')) : 'Card';
    const last4 = details.card.last4 ? `•• ${details.card.last4}` : '';
    return `${brand} ${last4}`.trim();
  }

  if (details.type) {
    return capitalize(details.type.replace(/_/g, ' '));
  }

  return undefined;
}

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
  } catch (err: any) {
    console.error('Error verifying Stripe webhook:', err);
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
        console.error(
          `Stripe amount mismatch for booking ${booking.id}: received ${paymentIntent.amount_received}, expected ${booking.totalPriceCents}`
        );
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
            { excludeBookingIds: [current.id], includePendingHolds: false },
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
        await stripeClient.refunds.create(
          { payment_intent: paymentIntentId, reason: 'duplicate' },
          { idempotencyKey: `conflict-refund-${booking.id}` }
        );
        const property = await prisma.property.findUnique({ where: { id: booking.propertyId } });
        const alertTo = property?.hostSupportEmail || process.env.ADMIN_EMAIL || 'ali@bunks.com';
        try {
          await sendEmail({
            to: alertTo,
            subject: `Action needed: booking ${booking.publicReference ?? booking.id} refunded (dates unavailable)`,
            html: `<p>${booking.guestName} (${booking.guestEmail}) paid for ${property?.name ?? 'a property'} ` +
              `${booking.checkInDate.toISOString().slice(0, 10)} → ${booking.checkOutDate.toISOString().slice(0, 10)}, ` +
              `but those dates were no longer available when the payment completed. The payment was refunded automatically. ` +
              `Please contact the guest.</p>`,
          });
        } catch (alertError) {
          console.error('Failed to send booking conflict alert', alertError);
        }
        return NextResponse.json({ received: true });
      }

      console.log(`✅ Booking ${booking.id} marked PAID and dates blocked`);

      const automatedEmailsEnabled = await isFeatureEnabled('automatedEmails');

      try {
        await sendReceiptEmail(booking.id, {
          paymentSummary: describePaymentMethod(paymentIntent),
        });
      } catch (err) {
        console.error('Failed to send receipt email', err);
      }

      if (automatedEmailsEnabled) {
        try {
          await sendBookingConfirmation(booking.id);
        } catch (err) {
          console.error('Failed to send booking confirmation email', err);
        }

        try {
          await sendHostNotification(booking.id);
        } catch (err) {
          console.error('Failed to send host notification email', err);
        }
      } else {
        console.info('Automated emails disabled; skipping confirmation + host notification.');
      }

      try {
        await sendBookingWelcomeEmail(booking.id);
      } catch (err) {
        console.error('Failed to send booking welcome email', err);
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

          // A full refund cancels the stay and frees its dates.
          if (charge.refunded && booking.status !== 'CANCELLED') {
            await prisma.$transaction(async (tx) => {
              await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
              await releaseBookingNights(booking, tx);
            });
          }

          try {
            // Import dynamically or ensure top-level import exists
            // Since we are inside the route, let's assume imports are added.
            // Using the imported function from top of file (need to add import first, doing in next step if needed, or assumming I can add it now).
            // Wait, I need to add the import to the top of the file first.
            await sendGuestRefundIssued(booking.id, {
              refundTotal: formattedTotal,
              paymentMethod: describePaymentMethod(charge.payment_intent as Stripe.PaymentIntent) || 'Credit Card',
              refundReason: 'Refund processed via Stripe',
              lineItems: [
                {
                  label: 'Refund',
                  amount: formattedTotal,
                },
              ],
              expectedArrivalWindow: '5-10 business days',
              initiatedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            });
            console.log(`✅ Sent refund email to guest for booking ${booking.id}`);

            // Notify Host/Ops about the adjustment
            try {
              await sendHostRefundAdjustment({
                bookingId: booking.id,
                logBookingId: booking.id,
                hostName: 'Host',
                propertyName: booking.property.name,
                guestName: booking.guestName,
                processedAt: new Date().toLocaleString('en-US', { timeZone: booking.property.timezone ?? 'America/Los_Angeles' }),
                guestRefund: formattedTotal,
                payoutBefore: 'See Dashboard',
                payoutAfter: 'See Dashboard',
                adjustmentReason: 'Refund processed via Stripe',
                adjustments: [
                  {
                    label: 'Refund to Guest',
                    amount: formattedTotal,
                    direction: 'debit',
                  }
                ],
                // We don't have detailed payout info here easily without checking balance transactions
                // But for notification purposes, showing the refund amount is key.
              });
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
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentIntentId = paymentIntent.id;

      // Attempt to find booking by intent
      const booking = await prisma.booking.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (booking) {
        console.log(`❌ Payment failed for booking ${booking.id}`);
        try {
          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: paymentIntent.currency.toUpperCase(),
          });
          const formattedAmount = formatter.format(paymentIntent.amount / 100);

          await sendPaymentFailure(booking.id, {
            amountDue: formattedAmount,
            dueBy: 'Immediately',
            failureReason: paymentIntent.last_payment_error?.message ?? 'Payment declined by bank',
            paymentLink: `https://bunks.com/my-trips/${booking.publicReference ?? booking.id}/essential`,
          });
          console.log(`✅ Sent payment failure email for booking ${booking.id}`);
        } catch (err) {
          console.error('Failed to send payment failure email', err);
        }
      }
    }

    // You can handle other event types here later

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error handling Stripe webhook:', err);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }
}