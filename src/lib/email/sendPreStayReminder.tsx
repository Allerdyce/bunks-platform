import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  calculateNights,
  formatDateForEmail,
  logEmailSend,
  renderEmail,
  resolveCheckInGuideUrl,
  resolveGuestBookUrl,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';
import { getWeatherForecast } from '@/lib/weather';
import { PreStayReminderEmail } from '@/emails/PreStayReminderEmail';

const EMAIL_TYPE = 'PRE_STAY_REMINDER' as const;

export async function sendPreStayReminder(bookingId: number) {
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

  let weatherSummary = `Expect crisp mornings and sunny afternoons around ${booking.property.timezone.includes('London') ? '62°F / 17°C' : '70°F / 21°C'}. Pack layers!`;

  // Attempt dynamic weather fetch
  if (booking.property.latitude && booking.property.longitude) {
    const forecast = await getWeatherForecast(booking.property.latitude, booking.property.longitude, checkIn);
    if (forecast) {
      weatherSummary = `${forecast.summary} Pack accordingly.`;
    }
  }

  const html = await renderEmail(
    <PreStayReminderEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      checkInDate={`${formatDateForEmail(checkIn)} · ${nights} nights`}
      weatherSummary={weatherSummary}
      packingList={['Layered outfits', 'Charging cables', 'Comfortable walking shoes', 'Camera']}
      checkInGuideUrl={resolveCheckInGuideUrl(booking)}
      guestBookUrl={resolveGuestBookUrl(booking)}
      hostSupportEmail={resolveHostSupportEmail(booking)}
    />
  );

  try {
    const response = await sendEmail({
      to: booking.guestEmail,
      subject: `48h reminder · ${booking.property.name}`,
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
