import { notAClaim } from '@/lib/email/claims';
import { stayTimeLabels } from '@/lib/email/helpers';
import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  calculateNights,
  formatDateForEmail,
  formatStayDates,
  renderEmail,
  resolveCheckInGuideUrl,
  resolveGuestBookUrl,
  logEmailSend,
  sendEmail,
} from '@/lib/email';
import { BookingWelcomeEmail } from '@/emails/BookingWelcomeEmail';
import { buildReferenceLinks, buildSupportDirectory, getOpsDetails } from '@/lib/opsDetails';
import { toAbsoluteUrl } from '@/lib/url';

const EMAIL_TYPE = 'BOOKING_WELCOME' as const;

// Used when the property has no house rules saved; kept generic so it's true for every home.
function defaultHouseRules(quietHours?: string | null) {
  return [
    'No smoking or vaping indoors.',
    `Quiet hours are ${quietHours?.trim() || '10 p.m.–7 a.m.'} out of respect for neighbors.`,
    'Please lock up whenever you head out.',
  ];
}

function propertyHouseRules(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((rule): rule is string => typeof rule === 'string' && rule.trim() !== '') : [];
}

function formatNightsLabel(nights: number) {
  return `${nights} night${nights === 1 ? '' : 's'}`;
}

async function hasWelcomeAlreadySent(bookingId: number) {
  const log = await prisma.emailLog.findFirst({
    where: {
      bookingId,
      type: EMAIL_TYPE,
      status: 'SENT',
      ...notAClaim,
    },
  });

  return Boolean(log);
}

export async function sendBookingWelcomeEmail(
  bookingId: number,
  options: { force?: boolean; hostPhone?: string; houseRules?: string[] } = {},
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: true,
    },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (!options.force) {
    const alreadySent = await hasWelcomeAlreadySent(booking.id);
    if (alreadySent) {
      return null;
    }
  }

  const opsDetails = await getOpsDetails();
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const nights = calculateNights(checkIn, checkOut);
  const stayDates = formatStayDates(checkIn, checkOut);
  const checkInGuideUrl = resolveCheckInGuideUrl(booking) ?? toAbsoluteUrl(opsDetails.liveInstructionsUrl);
  const guestBookUrl = resolveGuestBookUrl(booking) ?? toAbsoluteUrl(opsDetails.guestBookUrl);
  const supportEmail = booking.property.hostSupportEmail ?? opsDetails.supportEmail;
  const supportDirectory = buildSupportDirectory(opsDetails);
  let quickLinks = buildReferenceLinks(opsDetails, { checkInGuideUrl, guestBookUrl });

  if (!quickLinks.length) {
    quickLinks = [
      {
        label: 'Contact support',
        href: `mailto:${supportEmail}`,
        description: 'Email us with any questions about your stay',
      },
    ];
  }

  const times = stayTimeLabels(booking.property, opsDetails);
  const stayInfo = [
    { label: 'Stay dates', value: stayDates, helper: formatNightsLabel(nights) },
    {
      label: 'Check-in window',
      value: `${formatDateForEmail(checkIn)} · ${times.checkIn}`,
      helper: 'Self check-in available',
    },
    {
      label: 'Check-out',
      value: `${formatDateForEmail(checkOut)} · ${times.checkOut}`,
      helper: 'Cleaners arrive shortly after',
    },
  ];

  const savedRules = propertyHouseRules(booking.property.houseRules);
  const houseRules = options.houseRules?.length
    ? options.houseRules
    : savedRules.length
      ? savedRules
      : defaultHouseRules(booking.property.quietHours);

  const html = await renderEmail(
    <BookingWelcomeEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      introMessage="Below is the info we recommend bookmarking – our team updates these links whenever anything changes."
      stayInfo={stayInfo}
      quickLinks={quickLinks}
      houseRules={houseRules}
      hostContact={{
        email: supportEmail,
        phone: options.hostPhone || opsDetails.supportSmsNumber || undefined,
        note: opsDetails.conciergeNotes ?? 'Reply to this email with any questions about your stay.',
      }}
      supportDirectory={supportDirectory}
    />,
  );

  const log = async (status: 'SENT' | 'FAILED', error?: unknown) => {
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
      subject: `Welcome · ${booking.property.name}`,
      html,
    });

    await log('SENT');
    return response;
  } catch (error) {
    await log('FAILED', error);
    throw error;
  }
}
