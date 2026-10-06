import { notAClaim } from '@/lib/email/claims';
import { propertyToday, resolvePropertyTimeZone } from '@/lib/stayRules';
import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { CheckoutReminderEmail } from '@/emails/CheckoutReminderEmail';
import { CHECKOUT_CHECKLIST } from '@/emails/checkoutChecklist';
import {
  firstNameOf,
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveHostSupportEmail,
  sendEmail,
  stayTimeLabels,
} from '@/lib/email';

const EMAIL_TYPE = 'CHECKOUT_REMINDER' as const;

// Stay dates are calendar dates stored as UTC midnight.
const checkoutDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

async function alreadySent(bookingId: number) {
  const log = await prisma.emailLog.findFirst({
    where: { bookingId, type: EMAIL_TYPE, status: 'SENT', ...notAClaim },
  });
  return Boolean(log);
}

export async function sendCheckoutReminder(bookingId: number, options: { force?: boolean } = {}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (!options.force && (await alreadySent(booking.id))) {
    return null;
  }

  const checkoutDate = new Date(booking.checkOutDate);
  const checkoutIsToday =
    propertyToday(resolvePropertyTimeZone(booking.property)).getTime() ===
    Date.UTC(checkoutDate.getUTCFullYear(), checkoutDate.getUTCMonth(), checkoutDate.getUTCDate());
  const checkoutDay = checkoutIsToday ? 'today' : 'tomorrow';
  const supportEmail = resolveHostSupportEmail(booking);

  const html = await renderEmail(
    <CheckoutReminderEmail
      guestFirstName={firstNameOf(booking.guestName)}
      propertyName={booking.property.name}
      checkoutDay={checkoutDay}
      checkoutDate={checkoutDateFormatter.format(checkoutDate)}
      checkoutTime={stayTimeLabels(booking.property).checkOutTime}
      checklist={CHECKOUT_CHECKLIST}
      bookingReference={resolveBookingReference(booking)}
      supportEmail={supportEmail}
    />,
  );

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId: booking.id,
      to: booking.guestEmail,
      type: EMAIL_TYPE,
      status,
      error: error ? String((error as Error)?.message ?? error) : undefined,
    });
  };

  try {
    const response = await sendEmail({
      to: booking.guestEmail,
      subject: `Checkout ${checkoutDay} · ${booking.property.name}`,
      html,
      replyTo: supportEmail,
    });
    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
