import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { IssueReportConfirmationEmail } from '@/emails/IssueReportConfirmationEmail';
import type {
  IssueEvidenceItem,
  IssueReportConfirmationEmailProps,
} from '@/emails/IssueReportConfirmationEmail';
import { logEmailSend, renderEmail, resolveHostSupportEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'ISSUE_REPORT_CONFIRMATION' as const;

const dayFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  });

const timeFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  });

function resolveTimeZoneName(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
  }).formatToParts(date);

  return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
}

function coerceDate(value?: Date | string) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatSubmittedAt(timeZone?: string | null, rawDate?: Date | string) {
  const tz = timeZone || 'UTC';
  const date = coerceDate(rawDate) ?? new Date();
  const day = dayFormatter(tz).format(date);
  const time = timeFormatter(tz).format(date);
  const zone = resolveTimeZoneName(date, tz);
  return `${day} · ${time} ${zone}`;
}

type IssueReportConfirmationOptions = {
  ticketId: string;
  summary: string;
  severity?: IssueReportConfirmationEmailProps['severity'];
  location?: string;
  submittedAt?: Date | string;
  etaMinutes?: number;
  assignedTo?: string;
  nextSteps?: string[];
  evidence?: IssueEvidenceItem[];
  supportOverrides?: Partial<IssueReportConfirmationEmailProps['support']>;
  safetyContact?: IssueReportConfirmationEmailProps['safetyContact'];
  toOverride?: string;
  replyToOverride?: string;
  subjectOverride?: string;
};

export async function sendIssueReportConfirmation(
  bookingId: number,
  options: IssueReportConfirmationOptions,
) {
  if (!options?.ticketId) {
    throw new Error('sendIssueReportConfirmation requires a ticketId.');
  }

  if (!options.summary) {
    throw new Error('sendIssueReportConfirmation requires a summary.');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const support = {
    email: options.supportOverrides?.email ?? resolveHostSupportEmail(booking),
    phone: options.supportOverrides?.phone,
    concierge: options.supportOverrides?.concierge,
    escalationNote: options.supportOverrides?.escalationNote,
  } satisfies IssueReportConfirmationEmailProps['support'];

  const html = await renderEmail(
    <IssueReportConfirmationEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      ticketId={options.ticketId}
      submittedAt={formatSubmittedAt(booking.property.timezone, options.submittedAt)}
      summary={options.summary}
      severity={options.severity ?? 'medium'}
      location={options.location}
      etaMinutes={options.etaMinutes}
      assignedTo={options.assignedTo}
      nextSteps={options.nextSteps}
      evidence={options.evidence}
      support={support}
      safetyContact={options.safetyContact}
    />,
  );

  const to = options.toOverride ?? booking.guestEmail;
  const subject = options.subjectOverride ?? `Ticket ${options.ticketId} received · ${booking.property.name}`;
  const replyTo = options.replyToOverride ?? support.email;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId: booking.id,
      to,
      type: EMAIL_TYPE,
      status,
      error: error ? String((error as Error)?.message ?? error) : undefined,
    });
  };

  try {
    const response = await sendEmail({
      to,
      subject,
      html,
      replyTo,
    });
    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
