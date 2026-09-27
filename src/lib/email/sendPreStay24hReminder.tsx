import { notAClaim } from '@/lib/email/claims';
import { stayTimeLabels } from '@/lib/email/helpers';
import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  calculateNights,
  formatDateForEmail,
  formatStayDates,
  logEmailSend,
  renderEmail,
  resolveBookingReference,
  resolveCheckInGuideUrl,
  resolveGuestBookUrl,
  sendEmail,
} from '@/lib/email';
import { getWeatherForecast } from '@/lib/weather';
import { PreStay24hEmail } from '@/emails/PreStay24hEmail';
import { buildReferenceLinks, buildSupportDirectory, getOpsDetails } from '@/lib/opsDetails';
import { toAbsoluteUrl } from '@/lib/url';

const EMAIL_TYPE = 'PRE_STAY_REMINDER_24H' as const;

function formatNightsLabel(nights: number) {
  return `${nights} night${nights === 1 ? '' : 's'}`;
}

function buildChecklist(checkIn: Date, windowLabel: string) {
  return [
    {
      label: 'Confirm ETA',
      detail: `Reply to this email if your arrival time changed. Check-in starts ${formatDateForEmail(checkIn)} · ${windowLabel}.`,
    },
    {
      label: 'Save your check-in details',
      detail: 'Keep this email and your check-in guide handy in case you lose signal on the way.',
    },
  ];
}

export async function sendPreStay24hReminder(
  bookingId: number,
  options: {
    force?: boolean;
    outstandingTasks?: string[];
    weatherCallout?: string;
    roadStatus?: string;
    hostSupportPhone?: string;
  } = {},
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const bookingReference = resolveBookingReference(booking);

  // Check EmailLog for dedupe once Prisma client is regenerated after schema update
  if (!options.force) {
    const alreadySent = await prisma.emailLog.findFirst({
      where: { bookingId: booking.id, type: EMAIL_TYPE, status: 'SENT', ...notAClaim },
    });
    if (alreadySent) {
      return null;
    }
  }

  const checkIn = new Date(booking.checkInDate);
  const stayDates = formatStayDates(new Date(booking.checkInDate), new Date(booking.checkOutDate));
  const nights = calculateNights(new Date(booking.checkInDate), new Date(booking.checkOutDate));
  const opsDetails = await getOpsDetails();
  const supportEmail = booking.property.hostSupportEmail ?? opsDetails.supportEmail;
  const hostSupportPhone = options.hostSupportPhone || opsDetails.supportSmsNumber || undefined;
  const checkInGuideUrl = resolveCheckInGuideUrl(booking) ?? toAbsoluteUrl(opsDetails.liveInstructionsUrl);
  const guestBookUrl = resolveGuestBookUrl(booking) ?? toAbsoluteUrl(opsDetails.guestBookUrl);
  const referenceLinks = buildReferenceLinks(opsDetails, { checkInGuideUrl, guestBookUrl });
  const supportDirectory = buildSupportDirectory(opsDetails);
  const checkInWindowLabel = stayTimeLabels(booking.property, opsDetails).checkIn;
  const nightsLabel = formatNightsLabel(nights);

  let weatherCallout = options.weatherCallout ?? 'Check the local forecast before you travel.';

  // Attempt dynamic weather fetch
  if (!options.weatherCallout && booking.property.latitude && booking.property.longitude) {
    const forecast = await getWeatherForecast(booking.property.latitude, booking.property.longitude, checkIn);
    if (forecast) {
      weatherCallout = `${forecast.summary} Pack accordingly.`;
    }
  }

  const html = await renderEmail(
    <PreStay24hEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      arrivalWindow={`${formatDateForEmail(checkIn)} · ${checkInWindowLabel} · ${nightsLabel}`}
      weatherCallout={weatherCallout}
      // Road status removed per user request for accuracy
      roadStatus={options.roadStatus ?? 'Check local traffic apps for live updates.'}
      checkInGuideUrl={checkInGuideUrl}
      checkInChecklist={buildChecklist(checkIn, checkInWindowLabel)}
      outstandingTasks={options.outstandingTasks ?? ['Reply with your ETA if your plans change']}
      hostSupportEmail={supportEmail}
      hostSupportPhone={hostSupportPhone}
      supportNote={`Reference booking ${bookingReference} or ${stayDates} when you contact us.`}
      referenceLinks={referenceLinks}
      supportDirectory={supportDirectory}
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
      subject: `24h reminder · ${booking.property.name}`,
      html,
    });

    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
