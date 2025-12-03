import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  calculateNights,
  formatCurrencyFromCents,
  formatDateForEmail,
  renderEmail,
  resolveHostSupportEmail,
  logEmailSend,
  sendEmail,
} from '@/lib/email';
import { HostNotificationEmail } from '@/emails/HostNotificationEmail';

const EMAIL_TYPE = 'HOST_NOTIFICATION' as const;

function buildGoogleCalendarLink({
  title,
  details,
  checkIn,
  checkOut,
}: {
  title: string;
  details: string;
  checkIn: Date;
  checkOut: Date;
}) {
  const base = new URL('https://calendar.google.com/calendar/render');
  base.searchParams.set('action', 'TEMPLATE');
  base.searchParams.set('text', title);
  base.searchParams.set('details', details);
  base.searchParams.set('dates', `${formatGoogleDate(checkIn)}/${formatGoogleDate(checkOut)}`);
  return base.toString();
}

function formatGoogleDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export async function sendHostNotification(bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: true,
    },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const nights = calculateNights(checkIn, checkOut);
  const hostEmail = resolveHostSupportEmail(booking);

  const html = await renderEmail(
    <HostNotificationEmail
      hostName={hostEmail?.split('@')[0]}
      propertyName={booking.property.name}
      guestName={booking.guestName}
      checkInDate={formatDateForEmail(checkIn)}
      checkOutDate={formatDateForEmail(checkOut)}
      nights={nights}
      totalPayout={formatCurrencyFromCents(booking.totalPriceCents)}
      checklistItems={[
        'Confirm cleaners + turnovers',
        'Refresh guest amenities & local items',
        'Double-check smart lock + access codes',
      ]}
      calendarUrl={buildGoogleCalendarLink({
        title: `${booking.property.name} · ${booking.guestName}`,
        details: 'Manage prep tasks in Bunks admin.',
        checkIn,
        checkOut,
      })}
    />
  );

  try {
    const response = await sendEmail({
      to: hostEmail,
      subject: `New Bunks booking · ${booking.property.name}`,
      html,
    });

    await logEmailSend({
      bookingId: booking.id,
      to: hostEmail,
      type: EMAIL_TYPE,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await logEmailSend({
      bookingId: booking.id,
      to: hostEmail,
      type: EMAIL_TYPE,
      status: 'FAILED',
      error: message,
    });
    throw error;
  }
}
