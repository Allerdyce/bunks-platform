import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  calculateNights,
  formatDateForEmail,
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveGuestBookUrl,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';
import { MidStayCheckInEmail } from '@/emails/MidStayCheckInEmail';
import type { MidStayCheckInEmailProps } from '@/emails/MidStayCheckInEmail';
import { toAbsoluteUrl } from '@/lib/url';

const EMAIL_TYPE = 'MID_STAY_CONCIERGE' as const;

function defaultHousekeepingReminders(): string[] {
  return [
    'Hang damp gear or towels so the humidifiers can keep up.',
    'Latch balcony doors when you head out—mountain gusts pick up after 3pm.',
  ];
}

type MidStayCheckInOptions = {
  dayNumber?: number;
  vibeLine?: string;
  housekeepingReminders?: string[];
  guestBookUrl?: string;
  issueReportingUrl?: string;
  supportOverrides?: Partial<MidStayCheckInEmailProps['support']>;
  force?: boolean;
};

async function alreadySent(bookingId: number) {
  const log = await prisma.emailLog.findFirst({
    where: { bookingId, type: EMAIL_TYPE, status: 'SENT' },
  });
  return Boolean(log);
}

export async function sendMidStayCheckIn(bookingId: number, options: MidStayCheckInOptions = {}) {
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

  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const nights = calculateNights(checkIn, checkOut);
  const dayNumber = Math.min(Math.max(options.dayNumber ?? 2, 1), nights);
  const supportEmail = options.supportOverrides?.email ?? resolveHostSupportEmail(booking);

  const html = await renderEmail(
    <MidStayCheckInEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      stayProgress={`Day ${dayNumber} of ${nights}`}
      vibeLine={options.vibeLine}
      housekeepingReminders={options.housekeepingReminders ?? defaultHousekeepingReminders()}
      guestBookUrl={toAbsoluteUrl(options.guestBookUrl) ?? resolveGuestBookUrl(booking)}
      issueReportingUrl={options.issueReportingUrl ?? 'https://bunks.com/support/issues/new'}
      support={{
        email: supportEmail,
        phone: options.supportOverrides?.phone,
        concierge: options.supportOverrides?.concierge,
        note:
          options.supportOverrides?.note ??
          `Reference booking ${bookingReference} (${formatDateForEmail(checkIn)}) if you text us.`,
      }}
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
      subject: `Day ${dayNumber} check-in · ${booking.property.name}`,
      html,
    });

    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
