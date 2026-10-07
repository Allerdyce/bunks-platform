import { prisma } from '@/lib/prisma';
import {
  calculateNights,
  firstNameOf,
  formatCurrencyFromCents,
  formatDateForEmail,
  formatStayDates,
  renderEmail,
  resolveBookingReference,
  resolveCheckInGuideUrl,
  resolveHostSupportEmail,
  sendEmail,
  logEmailSend,
  stayTimeLabels,
  tripUrlFor,
} from '@/lib/email';
import { bookingChargeLines } from '@/lib/pricing/breakdown';
import { CANCELLATION_POLICY } from '@/data/policies';
import { BookingConfirmationEmail } from '@/emails/BookingConfirmationEmail';

const EMAIL_TYPE = 'BOOKING_CONFIRMATION' as const;

/** The guest's confirmation and receipt in one email, sent when the booking is paid. */
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
  const times = stayTimeLabels(booking.property);
  const chargeLines = (await bookingChargeLines(booking)) ?? [];

  const html = await renderEmail(
    <BookingConfirmationEmail
      guestFirstName={firstNameOf(booking.guestName)}
      propertyName={booking.property.name}
      bookingReference={resolveBookingReference(booking)}
      stayDates={formatStayDates(checkIn, checkOut)}
      checkIn={`${formatDateForEmail(checkIn)} · ${times.checkIn.replace(/^Check-in /, '')}`}
      checkOut={`${formatDateForEmail(checkOut)} · ${times.checkOut.replace(/^Checkout /, '')}`}
      nights={calculateNights(checkIn, checkOut)}
      guests={booking.guestCount}
      chargeLines={chargeLines.map((line) => ({ label: line.label, amount: formatCurrencyFromCents(line.amountCents) }))}
      totalPaid={formatCurrencyFromCents(booking.totalPriceCents)}
      tripUrl={tripUrlFor(booking)}
      guideUrl={resolveCheckInGuideUrl(booking)}
      cancellationPolicy={CANCELLATION_POLICY.summary}
      supportEmail={resolveHostSupportEmail(booking)}
    />
  );

  try {
    const response = await sendEmail({
      to: booking.guestEmail,
      replyTo: resolveHostSupportEmail(booking),
      subject: `You're booked · ${booking.property.name} · ${formatStayDates(checkIn, checkOut)}`,
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
