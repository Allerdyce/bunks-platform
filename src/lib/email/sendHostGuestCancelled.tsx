import { prisma } from '@/lib/prisma';
import { HostGuestCancelledEmail } from '@/emails/HostGuestCancelledEmail';
import { adminBookingsUrl, formatCurrencyFromCents, formatStayDates, renderEmail, resolveBookingReference, resolveHostSupportEmail } from '@/lib/email';
import { sendLoggedEmail } from './sendLoggedEmail';

/** Tells the Bunks team a paid booking was cancelled in Admin. */
export async function sendHostGuestCancelled({
  bookingId,
  refundCents,
  cancelledBy,
}: {
  bookingId: number;
  refundCents: number;
  cancelledBy?: string | null;
}) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { property: true } });
  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  const stayDates = formatStayDates(booking.checkInDate, booking.checkOutDate);
  const html = await renderEmail(
    <HostGuestCancelledEmail
      propertyName={booking.property.name}
      guestName={booking.guestName}
      stayDates={stayDates}
      bookingReference={resolveBookingReference(booking)}
      refundAmount={refundCents > 0 ? formatCurrencyFromCents(refundCents) : null}
      cancelledBy={cancelledBy}
      adminUrl={adminBookingsUrl()}
    />,
  );
  return sendLoggedEmail({
    bookingId: booking.id,
    type: 'HOST_GUEST_CANCELLED',
    to: resolveHostSupportEmail(booking),
    subject: `Booking cancelled · ${booking.property.name} · ${stayDates}`,
    html,
  });
}
