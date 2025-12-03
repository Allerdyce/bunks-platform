import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  calculateNights,
  formatCurrencyFromCents,
  formatDateForEmail,
  renderEmail,
  resolveCheckInGuideUrl,
  resolveGuestBookUrl,
  resolveHostSupportEmail,
  sendEmail,
  logEmailSend,
} from '@/lib/email';
import { BookingConfirmationEmail } from '@/emails/BookingConfirmationEmail';

const EMAIL_TYPE = 'BOOKING_CONFIRMATION' as const;

export async function sendBookingConfirmation(bookingId: number) {
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

  const html = await renderEmail(
    <BookingConfirmationEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      checkInDate={formatDateForEmail(checkIn)}
      checkOutDate={formatDateForEmail(checkOut)}
      nights={nights}
      totalPaid={formatCurrencyFromCents(booking.totalPriceCents)}
      checkInGuideUrl={resolveCheckInGuideUrl(booking)}
      guestBookUrl={resolveGuestBookUrl(booking)}
      hostSupportEmail={resolveHostSupportEmail(booking)}
    />
  );

  try {
    const response = await sendEmail({
      to: booking.guestEmail,
      subject: `Booking confirmed · ${booking.property.name}`,
      html,
    });

    await logEmailSend({
      bookingId: booking.id,
      to: booking.guestEmail,
      type: EMAIL_TYPE,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await logEmailSend({
      bookingId: booking.id,
      to: booking.guestEmail,
      type: EMAIL_TYPE,
      status: 'FAILED',
      error: message,
    });
    throw error;
  }
}
