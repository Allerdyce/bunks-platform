import * as React from 'react';
import { SystemBookingCreationFailedEmail } from '@/emails/SystemBookingCreationFailedEmail';
import type {
  SystemBookingCreationFailedEmailProps,
  BookingFailureActionItem,
  BookingFailureMetadataItem,
  BookingFailurePayloadSnippet,
} from '@/emails/SystemBookingCreationFailedEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'SYSTEM_BOOKING_CREATION_FAILED' as const;

const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'America/Denver',
});

type SystemBookingCreationFailedOptions = {
  incidentId: string;
  request: SystemBookingCreationFailedEmailProps['request'];
  errorSummary: string;
  actionItems?: BookingFailureActionItem[];
  environment?: string;
  occurredAt?: string;
  bookingReference?: string;
  guestName?: string;
  propertyName?: string;
  rootCauseHint?: string;
  metadata?: BookingFailureMetadataItem[];
  payloadSnippet?: BookingFailurePayloadSnippet;
  dashboards?: SystemBookingCreationFailedEmailProps['dashboards'];
  escalationNotes?: string;
  bookingId?: number;
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
};

function ensurePayload(options: SystemBookingCreationFailedOptions) {
  if (!options.incidentId) throw new Error('sendSystemBookingCreationFailed requires incidentId.');
  if (!options.request) throw new Error('sendSystemBookingCreationFailed requires request context.');
  if (!options.request.endpoint) throw new Error('sendSystemBookingCreationFailed requires request.endpoint.');
  if (!options.request.method) throw new Error('sendSystemBookingCreationFailed requires request.method.');
  if (!options.request.statusCode) throw new Error('sendSystemBookingCreationFailed requires request.statusCode.');
  if (!options.errorSummary) throw new Error('sendSystemBookingCreationFailed requires errorSummary.');
}

export async function sendSystemBookingCreationFailed(options: SystemBookingCreationFailedOptions) {
  ensurePayload(options);

  const occurredAt = options.occurredAt ?? formatter.format(new Date());
  const environment = options.environment ?? 'production';

  const html = await renderEmail(
    <SystemBookingCreationFailedEmail
      incidentId={options.incidentId}
      environment={environment}
      occurredAt={occurredAt}
      request={options.request}
      bookingReference={options.bookingReference}
      guestName={options.guestName}
      propertyName={options.propertyName}
      errorSummary={options.errorSummary}
      rootCauseHint={options.rootCauseHint}
      actionItems={options.actionItems ?? []}
      metadata={options.metadata}
      payloadSnippet={options.payloadSnippet}
      dashboards={options.dashboards}
      escalationNotes={options.escalationNotes}
    />,
  );

  const to = options.to ?? 'ops@bunks.com';
  const subject = options.subjectOverride ?? `[Booking Creation Failed] ${options.request.endpoint}`;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId: options.bookingId,
      to: Array.isArray(to) ? to.join(',') : to,
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
      cc: options.cc,
      replyTo: options.replyTo,
    });
    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
