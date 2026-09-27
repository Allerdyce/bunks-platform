import { notAClaim } from '@/lib/email/claims';
import { propertyToday, resolvePropertyTimeZone } from '@/lib/stayRules';
import { stayTimeLabels } from '@/lib/email/helpers';
import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { CheckoutReminderEmail } from '@/emails/CheckoutReminderEmail';
import type {
  CheckoutReminderEmailProps,
  CheckoutStep,
} from '@/emails/CheckoutReminderEmail';
import {
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';

const EMAIL_TYPE = 'CHECKOUT_REMINDER' as const;

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(timeZone: string) {
  if (!dateFormatterCache.has(timeZone)) {
    dateFormatterCache.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone,
      }),
    );
  }
  return dateFormatterCache.get(timeZone)!;
}

function formatCheckoutDate(date: Date, timeZone: string) {
  return getDateFormatter(timeZone).format(date);
}

// Generic checkout asks that hold for every home; property-specific steps can be passed in.
function defaultKeySteps(): CheckoutStep[] {
  return [
    { label: 'Kitchen', detail: 'Load and start the dishwasher, and take perishables out of the fridge.' },
    { label: 'Heating & cooling', detail: 'Turn the heating or air conditioning down before you leave.' },
  ];
}

function defaultKitchenReminders(): string[] {
  return ['Bag any perishables you leave behind so we can clear them.'];
}

function defaultLaundryReminders(): string[] {
  return ['Leave used towels in the bathroom.'];
}

function defaultLockupSteps(): string[] {
  return [
    'Close and lock every door and window.',
    'Double-check you have all your belongings, including chargers.',
  ];
}

async function alreadySent(bookingId: number) {
  const log = await prisma.emailLog.findFirst({
    where: { bookingId, type: EMAIL_TYPE, status: 'SENT', ...notAClaim },
  });
  return Boolean(log);
}

type CheckoutReminderOptions = {
  checkoutDateOverride?: string;
  checkoutTimeOverride?: string;
  cleanerArrivalWindow?: string;
  lateCheckoutNote?: string;
  propertyAddress?: string;
  directionsUrl?: string;
  parkingNote?: string;
  keySteps?: CheckoutStep[];
  kitchenReminders?: string[];
  laundryReminders?: string[];
  lockupSteps?: string[];
  trashNote?: string;
  supportOverrides?: Partial<CheckoutReminderEmailProps['support']>;
  toOverride?: string;
  replyToOverride?: string;
  subjectOverride?: string;
  force?: boolean;
};

export async function sendCheckoutReminder(bookingId: number, options: CheckoutReminderOptions = {}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const bookingReference = resolveBookingReference(booking);

  if (!options.force) {
    const sent = await alreadySent(booking.id);
    if (sent) {
      return null;
    }
  }

  const timeZone = resolvePropertyTimeZone(booking.property);
  const checkoutDate = new Date(booking.checkOutDate);
  // checkOutDate is a calendar date stored as UTC midnight; the time comes from the property.
  const checkoutDateLabel = options.checkoutDateOverride ?? formatCheckoutDate(checkoutDate, 'UTC');
  const checkoutTimeLabel = options.checkoutTimeOverride ?? stayTimeLabels(booking.property).checkOutTime;
  const checkoutIsToday =
    propertyToday(timeZone).getTime() === Date.UTC(checkoutDate.getUTCFullYear(), checkoutDate.getUTCMonth(), checkoutDate.getUTCDate());

  const support = {
    email: options.supportOverrides?.email ?? resolveHostSupportEmail(booking),
    phone: options.supportOverrides?.phone,
    concierge: options.supportOverrides?.concierge,
    note: options.supportOverrides?.note ?? `Reference booking ${bookingReference} if you need extra time.`,
  } satisfies CheckoutReminderEmailProps['support'];

  const html = await renderEmail(
    <CheckoutReminderEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      checkoutDate={checkoutDateLabel}
      checkoutTime={checkoutTimeLabel}
      cleanerArrivalWindow={options.cleanerArrivalWindow}
      lateCheckoutNote={options.lateCheckoutNote}
      propertyAddress={options.propertyAddress}
      directionsUrl={options.directionsUrl}
      parkingNote={options.parkingNote}
      keySteps={options.keySteps ?? defaultKeySteps()}
      kitchenReminders={options.kitchenReminders ?? defaultKitchenReminders()}
      laundryReminders={options.laundryReminders ?? defaultLaundryReminders()}
      lockupSteps={options.lockupSteps ?? defaultLockupSteps()}
      trashNote={options.trashNote ?? 'Please bag trash and recycling and put it in the outdoor bins.'}
      support={support}
    />,
  );

  const to = options.toOverride ?? booking.guestEmail;
  const subject = options.subjectOverride ?? `Checkout ${checkoutIsToday ? 'today' : 'tomorrow'} · ${booking.property.name}`;
  const replyTo = options.replyToOverride ?? support.email;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId: booking.id,
      to,
      type: EMAIL_TYPE,
      status,
      error: error ? String((error as Error)?.message ?? error) : undefined,
    });
  };

  try {
    const response = await sendEmail({
      to,
      subject,
      html,
      replyTo,
    });
    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
