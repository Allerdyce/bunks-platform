import * as React from 'react';
import { SystemEmailFailedEmail } from '@/emails/SystemEmailFailedEmail';
import type { FailureActionItem, FailureMetadataItem } from '@/emails/SystemEmailFailedEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'SYSTEM_EMAIL_FAILED' as const;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'America/Denver',
});

type SystemEmailFailedOptions = {
  incidentId: string;
  recipient: string;
  bounceType: string;
  description: string;
  actionItems?: FailureActionItem[];
  environment?: string;
  occurredAt?: string;
  originalSubject?: string;
  stream?: string;
  bounceSubtype?: string;
  suppressionReason?: string;
  messageId?: string;
  triggeredBy?: string;
  metadata?: FailureMetadataItem[];
  relatedLogsUrl?: string;
  escalationNotes?: string;
  bookingId?: number;
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
};

function ensurePayload(options: SystemEmailFailedOptions) {
  if (!options.incidentId) {
    throw new Error('sendSystemEmailFailed requires incidentId.');
  }
  if (!options.recipient) {
    throw new Error('sendSystemEmailFailed requires recipient.');
  }
  if (!options.bounceType) {
    throw new Error('sendSystemEmailFailed requires bounceType.');
  }
  if (!options.description) {
    throw new Error('sendSystemEmailFailed requires description.');
  }
}

export async function sendSystemEmailFailed(options: SystemEmailFailedOptions) {
  ensurePayload(options);

  const occurredAt = options.occurredAt ?? dateFormatter.format(new Date());
  const environment = options.environment ?? 'production';

  const html = await renderEmail(
    <SystemEmailFailedEmail
      incidentId={options.incidentId}
      environment={environment}
      occurredAt={occurredAt}
      recipient={options.recipient}
      originalSubject={options.originalSubject}
      stream={options.stream}
      bounceType={options.bounceType}
      bounceSubtype={options.bounceSubtype}
      description={options.description}
      suppressionReason={options.suppressionReason}
      messageId={options.messageId}
      triggeredBy={options.triggeredBy ?? 'postmark-webhook'}
      actionItems={options.actionItems ?? []}
      metadata={options.metadata}
      relatedLogsUrl={options.relatedLogsUrl}
      escalationNotes={options.escalationNotes}
    />,
  );

  const to = options.to ?? 'ops@bunks.com';
  const subject = options.subjectOverride ?? `[Email Failure] ${options.bounceType} · ${options.recipient}`;

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
      replyTo: options.replyTo,
      cc: options.cc,
    });
    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
