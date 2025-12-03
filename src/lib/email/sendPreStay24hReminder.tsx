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
      label: 'Download guide offline',
      detail: 'Cell coverage dips near the cabin—save codes and parking info before you depart.',
    },
    {
      label: 'Stage IDs + payment card',
      detail: 'Have the reservation holder present at arrival if asked.',
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
      where: { bookingId: booking.id, type: EMAIL_TYPE, status: 'SENT' },
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
  const hostSupportPhone = options.hostSupportPhone ?? opsDetails.supportSmsNumber;
  const checkInGuideUrl = resolveCheckInGuideUrl(booking) ?? toAbsoluteUrl(opsDetails.liveInstructionsUrl);
  const guestBookUrl = resolveGuestBookUrl(booking) ?? toAbsoluteUrl(opsDetails.guestBookUrl);
  const referenceLinks = buildReferenceLinks(opsDetails, { checkInGuideUrl, guestBookUrl });
  const supportDirectory = buildSupportDirectory(opsDetails);
  const checkInWindowLabel = opsDetails.checkInWindow ?? 'Check-in after 16:00';
  const nightsLabel = formatNightsLabel(nights);

  const html = await renderEmail(
    <PreStay24hEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      arrivalWindow={`${formatDateForEmail(checkIn)} · ${checkInWindowLabel} · ${nightsLabel}`}
      weatherCallout={options.weatherCallout ?? 'Temps dip to the low 30s after sunset—pack layers and boots.'}
      roadStatus={options.roadStatus ?? 'Highways are clear. Driveway can be slick; AWD recommended after fresh snow.'}
      checkInGuideUrl={checkInGuideUrl}
      checkInChecklist={buildChecklist(checkIn, checkInWindowLabel)}
      outstandingTasks={options.outstandingTasks ?? ['Share ETA via reply if delayed', 'Double-check you packed swim gear for the hot tub']}
      hostSupportEmail={supportEmail}
      hostSupportPhone={hostSupportPhone}
      supportNote={`Reference booking ${bookingReference} or ${stayDates} if you text our concierge.`}
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
