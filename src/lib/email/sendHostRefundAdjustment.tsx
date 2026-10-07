import { prisma } from '@/lib/prisma';
import { HostRefundAdjustmentEmail } from '@/emails/HostRefundAdjustmentEmail';
import { adminBookingsUrl, formatCurrencyFromCents, formatStayDates, renderEmail, resolveBookingReference, resolveHostSupportEmail } from '@/lib/email';
import { sendLoggedEmail } from './sendLoggedEmail';

/** Tells the Bunks team about a refund made in Stripe. */
export async function sendHostRefundAdjustment({
  bookingId,
  refundCents,
  bookingCancelled,
}: {
  bookingId: number;
  refundCents: number;
  bookingCancelled: boolean;
}) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { property: true } });
  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  const refundAmount = formatCurrencyFromCents(refundCents);
  const html = await renderEmail(
    <HostRefundAdjustmentEmail
      propertyName={booking.property.name}
      guestName={booking.guestName}
      stayDates={formatStayDates(booking.checkInDate, booking.checkOutDate)}
      bookingReference={resolveBookingReference(booking)}
      refundAmount={refundAmount}
      bookingCancelled={bookingCancelled}
      adminUrl={adminBookingsUrl()}
    />,
  );
  return sendLoggedEmail({
    bookingId: booking.id,
    type: 'HOST_REFUND_ADJUSTMENT',
    to: resolveHostSupportEmail(booking),
    subject: `Refund of ${refundAmount} · ${booking.property.name} · ${resolveBookingReference(booking)}`,
    html,
  });
}
