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
const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();

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

function getTimeFormatter(timeZone: string) {
  if (!timeFormatterCache.has(timeZone)) {
    timeFormatterCache.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone,
      }),
    );
  }
  return timeFormatterCache.get(timeZone)!;
}

function formatCheckoutDate(date: Date, timeZone: string) {
  return getDateFormatter(timeZone).format(date);
}

function formatCheckoutTime(date: Date, timeZone: string) {
  return getTimeFormatter(timeZone).format(date);
}

function defaultKeySteps(propertyName: string): CheckoutStep[] {
  return [
    {
      label: 'Kitchen',
      detail: 'Run the dishwasher (normal cycle) and leave counters crumb-free so chefs can reset quickly.',
    },
    {
      label: 'Climate',
      detail: `Set thermostats to 65°F so ${propertyName} is stable for the next arrival.`,
    },
    {
      label: 'Gear',
      detail: 'Stage rentals or add-on gear in the mudroom so ops can inventory.',
    },
  ];
}

function defaultKitchenReminders(): string[] {
  return [
    'Empty perishables from the fridge or bag them for us to toss.',
    'Please rinse cookware and leave it in the drying rack if the dishwasher is full.',
  ];
}

function defaultLaundryReminders(): string[] {
  return [
    'Start one load of towels if you have time (normal, warm).',
    'Leave extra linens/towels piled on the primary bed.',
  ];
}

function defaultLockupSteps(propertyName: string): string[] {
  return [
    'Close and latch every deck door and window.',
    'Arm the security keypad before you leave.',
    `Double-check you have all personal items—anything left behind in ${propertyName} goes to the concierge locker.`,
  ];
}

async function alreadySent(bookingId: number) {
  const log = await prisma.emailLog.findFirst({
    where: { bookingId, type: EMAIL_TYPE, status: 'SENT' },
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

  const timeZone = booking.property.timezone ?? 'UTC';
  const checkoutDate = new Date(booking.checkOutDate);
  const checkoutDateLabel = options.checkoutDateOverride ?? formatCheckoutDate(checkoutDate, timeZone);
  const checkoutTimeLabel = options.checkoutTimeOverride ?? formatCheckoutTime(checkoutDate, timeZone);

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
      cleanerArrivalWindow={options.cleanerArrivalWindow ?? 'Cleaners arrive ~30 minutes after checkout'}
      lateCheckoutNote={options.lateCheckoutNote}
      propertyAddress={options.propertyAddress}
      directionsUrl={options.directionsUrl}
      parkingNote={options.parkingNote}
      keySteps={options.keySteps ?? defaultKeySteps(booking.property.name)}
      kitchenReminders={options.kitchenReminders ?? defaultKitchenReminders()}
      laundryReminders={options.laundryReminders ?? defaultLaundryReminders()}
      lockupSteps={options.lockupSteps ?? defaultLockupSteps(booking.property.name)}
      trashNote={options.trashNote ?? 'Bag trash + recycling and place it in the outdoor bins with lids latched.'}
      support={support}
    />,
  );

  const to = options.toOverride ?? booking.guestEmail;
  const subject = options.subjectOverride ?? `Checkout tomorrow · ${booking.property.name}`;
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
