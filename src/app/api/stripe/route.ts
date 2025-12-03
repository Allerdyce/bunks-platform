// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { getStripeClient } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendReceiptEmail } from '@/lib/email/sendReceiptEmail';
import { sendBookingWelcomeEmail } from '@/lib/email/sendBookingWelcomeEmail';
import { sendBookingConfirmation } from '@/lib/email/sendBookingConfirmation';
import { sendHostNotification } from '@/lib/email/sendHostNotification';
import { reserveAddonWithProvider } from '@/lib/providers';
import type { SupportedProvider } from '@/lib/providers/providerTypes';
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

      const bookingAddons = await prisma.bookingAddon.findMany({
        where: { bookingId: booking.id },
        include: { addon: true },
      });

      const viatorAddons = bookingAddons.filter(
        (bookingAddon) => bookingAddon.addon.provider === 'viator'
      );

      const addonsFeatureEnabled = await isFeatureEnabled('addons');

      if (addonsFeatureEnabled && viatorAddons.length) {
        const metadataGuests = Number(paymentIntent.metadata?.guests);
        const partySize = Number.isFinite(metadataGuests) && metadataGuests > 0 ? metadataGuests : 1;

        for (const bookingAddon of viatorAddons) {
          if (bookingAddon.providerStatus === 'confirmed') {
            continue;
          }

          try {
            const providerResult = await reserveAddonWithProvider({
              addonId: bookingAddon.addonId,
              addonSlug: bookingAddon.addon.slug,
              provider: bookingAddon.addon.provider as SupportedProvider,
              providerProductId: bookingAddon.addon.providerProductId,
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate,
               activityDate: bookingAddon.activityDate ?? booking.checkInDate,
               activityTimeSlot: bookingAddon.activityTimeSlot ?? null,
              guestName: booking.guestName,
              guestEmail: booking.guestEmail,
              partySize,
            });

            if (!providerResult) {
              continue;
            }

            await prisma.bookingAddon.update({
              where: { id: bookingAddon.id },
              data: {
                providerStatus: providerResult.status ?? 'confirmed',
                providerConfirmationCode: providerResult.confirmationCode,
                providerMetadata: (providerResult.rawResponse ?? null) as Prisma.InputJsonValue,
              },
            });
          } catch (providerError) {
            console.error('Viator reservation failed after payment', {
              bookingId: booking.id,
              bookingAddonId: bookingAddon.id,
              providerError,
            });

            await prisma.bookingAddon.update({
              where: { id: bookingAddon.id },
              data: {
                providerStatus: 'failed',
                providerMetadata: {
                  error: providerError instanceof Error ? providerError.message : String(providerError),
                } as Prisma.InputJsonValue,
              },
            });
          }
        }
      } else if (!addonsFeatureEnabled && viatorAddons.length) {
        console.info('Add-ons feature disabled; skipping provider reservations.');
      }

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