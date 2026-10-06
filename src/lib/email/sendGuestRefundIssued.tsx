import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { GuestRefundIssuedEmail } from '@/emails/GuestRefundIssuedEmail';
import { firstNameOf, formatCurrencyFromCents, formatStayDates, renderEmail, resolveBookingReference, resolveHostSupportEmail } from '@/lib/email';
import { sendLoggedEmail } from './sendLoggedEmail';

/** Tells the guest about a refund made in Stripe. */
export async function sendGuestRefundIssued(
  bookingId: number,
  { refundCents, bookingCancelled }: { refundCents: number; bookingCancelled: boolean },
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { property: true } });
  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  const supportEmail = resolveHostSupportEmail(booking);
  const refundAmount = formatCurrencyFromCents(refundCents);
  const html = await renderEmail(
    <GuestRefundIssuedEmail
      guestFirstName={firstNameOf(booking.guestName)}
      propertyName={booking.property.name}
      bookingReference={resolveBookingReference(booking)}
      stayDates={formatStayDates(booking.checkInDate, booking.checkOutDate)}
      refundAmount={refundAmount}
      bookingCancelled={bookingCancelled}
      supportEmail={supportEmail}
    />,
  );
  return sendLoggedEmail({
    bookingId: booking.id,
    type: 'GUEST_REFUND_ISSUED',
    to: booking.guestEmail,
    replyTo: supportEmail,
    subject: `Refund of ${refundAmount} · ${booking.property.name} · ${resolveBookingReference(booking)}`,
    html,
  });
}
