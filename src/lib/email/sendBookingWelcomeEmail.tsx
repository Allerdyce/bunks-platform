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

const DEFAULT_HOUSE_RULES = [
  'No smoking indoors or on the decks – sensors will alert us.',
  'Quiet hours are 22:00–07:00 out of respect for neighbors.',
  'Please rinse and cover the hot tub after each soak.',
  'Lock doors and arm the security system whenever you leave.',
];

function formatNightsLabel(nights: number) {
  return `${nights} night${nights === 1 ? '' : 's'}`;
}

async function hasWelcomeAlreadySent(bookingId: number) {
  const log = await prisma.emailLog.findFirst({
    where: {
      bookingId,
      type: EMAIL_TYPE,
      status: 'SENT',
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
        description: 'We reply quickly – 7 days a week',
      },
    ];
  }

  const stayInfo = [
    { label: 'Stay dates', value: stayDates, helper: formatNightsLabel(nights) },
    {
      label: 'Check-in window',
      value: `${formatDateForEmail(checkIn)} · ${opsDetails.checkInWindow ?? 'Check-in after 16:00'}`,
      helper: 'Self check-in available',
    },
    {
      label: 'Check-out',
      value: `${formatDateForEmail(checkOut)} · ${opsDetails.checkOutTime ?? 'Checkout by 10:00'}`,
      helper: 'Cleaners arrive shortly after',
    },
  ];

  const houseRules = options.houseRules?.length ? options.houseRules : DEFAULT_HOUSE_RULES;

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
        phone: options.hostPhone ?? opsDetails.supportSmsNumber,
        note: opsDetails.conciergeNotes ?? 'Reach us any time – average response under 5 minutes.',
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
