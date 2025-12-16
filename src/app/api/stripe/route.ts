// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendReceiptEmail } from '@/lib/email/sendReceiptEmail';
import { sendBookingWelcomeEmail } from '@/lib/email/sendBookingWelcomeEmail';
import { sendBookingConfirmation } from '@/lib/email/sendBookingConfirmation';
import { sendHostNotification } from '@/lib/email/sendHostNotification';
import { sendGuestRefundIssued } from '@/lib/email/sendGuestRefundIssued';
import Stripe from 'stripe';
import { isFeatureEnabled } from '@/lib/featureFlags';

export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function normalizeToMidnight(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

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
    return NextResponse.json(
      { error: 'Invalid signature', details: String(err?.message ?? err) },
      { status: 400 }
    );
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

      // 1) Mark booking as PAID
      if (booking.status !== 'PAID') {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'PAID' },
        });
      }

      // 2) Block dates for this booking (DIRECT source)
      const checkInDate = normalizeToMidnight(new Date(booking.checkInDate));
      const checkOutDate = normalizeToMidnight(new Date(booking.checkOutDate));

      const blockedDates: Date[] = [];
      const cursor = new Date(checkInDate);
      while (cursor < checkOutDate) {
        blockedDates.push(
          new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
        );
        cursor.setDate(cursor.getDate() + 1);
      }

      if (blockedDates.length > 0) {
        const uniqueIsoDates = Array.from(
          new Set(blockedDates.map((d) => d.toISOString()))
        );

        await prisma.blockedDate.createMany({
          data: uniqueIsoDates.map((iso) => ({
            propertyId: booking.propertyId,
            date: new Date(iso),
            source: 'DIRECT',
          })),
          skipDuplicates: true,
        });
      }

      console.log(
        `✅ Booking ${booking.id} marked PAID and ${blockedDates.length} dates blocked`
      );

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
          } catch (err) {
            console.error('Failed to send guest refund email', err);
          }
        } else {
          console.warn(`Refund event for unknown booking PaymentIntent: ${paymentIntentId}`);
        }
      }
    }

    // You can handle other event types here later

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error handling Stripe webhook:', err);
    return NextResponse.json(
      { error: 'Webhook handler error', details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}