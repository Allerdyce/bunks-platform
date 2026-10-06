import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { CancellationConfirmationEmail } from '@/emails/CancellationConfirmationEmail';
import { firstNameOf, formatCurrencyFromCents, formatStayDates, renderEmail, resolveBookingReference, resolveHostSupportEmail } from '@/lib/email';
import { sendLoggedEmail } from './sendLoggedEmail';
import { CANCELLATION_POLICY } from '@/data/policies';
import { toAbsoluteUrl } from '@/lib/url';

/** Tells the guest their paid booking was cancelled, and what was refunded. */
export async function sendCancellationConfirmation(bookingId: number, { refundCents }: { refundCents: number }) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { property: true } });
  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  const supportEmail = resolveHostSupportEmail(booking);
  const html = await renderEmail(
    <CancellationConfirmationEmail
      guestFirstName={firstNameOf(booking.guestName)}
      propertyName={booking.property.name}
      bookingReference={resolveBookingReference(booking)}
      stayDates={formatStayDates(booking.checkInDate, booking.checkOutDate)}
      refundAmount={refundCents > 0 ? formatCurrencyFromCents(refundCents) : null}
      cancellationPolicy={CANCELLATION_POLICY.summary}
      rebookUrl={toAbsoluteUrl('/') ?? 'https://www.bunks.com'}
      supportEmail={supportEmail}
    />,
  );
  return sendLoggedEmail({
    bookingId: booking.id,
    type: 'CANCELLATION_CONFIRMATION',
    to: booking.guestEmail,
    replyTo: supportEmail,
    subject: `Booking cancelled · ${booking.property.name} · ${resolveBookingReference(booking)}`,
    html,
  });
}
