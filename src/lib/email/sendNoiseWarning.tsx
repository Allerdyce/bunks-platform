import * as React from 'react';
import { prisma } from '@/lib/prisma';
import {
  logEmailSend,
  renderEmail,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';
import {
  NoiseWarningEmail,
  NoiseWarningEmailProps,
  NoiseWarningGuideline,
} from '@/emails/NoiseWarningEmail';

const EMAIL_TYPE = 'NOISE_WARNING' as const;

function formatDetectedAtLabel(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(date);
}

type SendNoiseWarningOptions = {
  detectedAt?: Date;
  quietHours?: string;
  alertReason?: string;
  location?: string;
  decibelReading?: string;
  monitorType?: string;
  requestActions?: string[];
  guidelines?: NoiseWarningGuideline[];
  followUpWithin?: string;
  communityNote?: string;
  issueReportingUrl?: string;
  supportOverrides?: Partial<NoiseWarningEmailProps['support']>;
  subjectOverride?: string;
};

export async function sendNoiseWarning(bookingId: number, options: SendNoiseWarningOptions = {}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const timezone = booking.property.timezone ?? 'UTC';
  const detectedAtLabel = formatDetectedAtLabel(options.detectedAt ?? new Date(), timezone);
  const quietHours = options.quietHours ?? '22:00 – 08:00';
  const supportEmail = options.supportOverrides?.email ?? resolveHostSupportEmail(booking);

  const html = await renderEmail(
    <NoiseWarningEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      detectedAt={detectedAtLabel}
      quietHours={quietHours}
      alertReason={options.alertReason}
      location={options.location}
      decibelReading={options.decibelReading}
      monitorType={options.monitorType}
      requestActions={options.requestActions}
      guidelines={options.guidelines}
      followUpWithin={options.followUpWithin ?? '10 minutes'}
      communityNote={options.communityNote}
      issueReportingUrl={options.issueReportingUrl ?? 'https://bunks.com/support/issues/new'}
      support={{
        email: supportEmail,
        phone: options.supportOverrides?.phone,
        concierge: options.supportOverrides?.concierge,
        note:
          options.supportOverrides?.note ??
          `Reply to this email so we know ${booking.property.name} is back within quiet hours.`,
      }}
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
      subject: options.subjectOverride ?? `Friendly noise check · ${booking.property.name}`,
      html,
    });

    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
