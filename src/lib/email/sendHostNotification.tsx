import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  adminBookingsUrl,
  calculateNights,
  formatCurrencyFromCents,
  formatStayDates,
  renderEmail,
  resolveBookingReference,
  resolveHostSupportEmail,
} from '@/lib/email';
import { sendLoggedEmail } from './sendLoggedEmail';
import { HostNotificationEmail } from '@/emails/HostNotificationEmail';

/** Tells the Bunks team (the home's support address) about a paid booking. */
export async function sendHostNotification(bookingId: number) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { property: true } });
  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  const stayDates = formatStayDates(booking.checkInDate, booking.checkOutDate);
  const html = await renderEmail(
    <HostNotificationEmail
      propertyName={booking.property.name}
      guestName={booking.guestName}
      guestEmail={booking.guestEmail}
      guests={booking.guestCount}
      stayDates={stayDates}
      nights={calculateNights(booking.checkInDate, booking.checkOutDate)}
      totalPaid={formatCurrencyFromCents(booking.totalPriceCents)}
      bookingReference={resolveBookingReference(booking)}
      source={
        booking.paymentLinkToken
          ? `Private payment link${booking.createdByAdmin ? ` (${booking.createdByAdmin})` : ''}`
          : 'Website checkout'
      }
      adminUrl={adminBookingsUrl()}
    />,
  );
  return sendLoggedEmail({
    bookingId: booking.id,
    type: 'HOST_NOTIFICATION',
    to: resolveHostSupportEmail(booking),
    subject: `New booking · ${booking.property.name} · ${stayDates}`,
    html,
  });
}
