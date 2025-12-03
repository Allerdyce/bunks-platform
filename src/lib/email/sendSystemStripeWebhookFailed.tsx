import * as React from 'react';
import { SystemStripeWebhookFailedEmail } from '@/emails/SystemStripeWebhookFailedEmail';
import type {
  SystemStripeWebhookFailedEmailProps,
  WebhookActionItem,
  WebhookMetadataItem,
} from '@/emails/SystemStripeWebhookFailedEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'SYSTEM_STRIPE_WEBHOOK_FAILED' as const;

const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'America/Denver',
});

type StripeWebhookFailureOptions = {
  incidentId: string;
  endpoint: string;
  eventId: string;
  eventType: string;
  attemptNumber: number;
  maxAttempts: number;
  lastResponseCode: string;
  errorSummary: string;
  actionItems?: WebhookActionItem[];
  environment?: string;
  occurredAt?: string;
  suppressionRisk?: string;
  metadata?: WebhookMetadataItem[];
  payloadSnippet?: SystemStripeWebhookFailedEmailProps['payloadSnippet'];
  dashboards?: SystemStripeWebhookFailedEmailProps['dashboards'];
  escalationNotes?: string;
  bookingId?: number;
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
};

function ensurePayload(options: StripeWebhookFailureOptions) {
  if (!options.incidentId) throw new Error('sendSystemStripeWebhookFailed requires incidentId.');
  if (!options.endpoint) throw new Error('sendSystemStripeWebhookFailed requires endpoint.');
  if (!options.eventId) throw new Error('sendSystemStripeWebhookFailed requires eventId.');
  if (!options.eventType) throw new Error('sendSystemStripeWebhookFailed requires eventType.');
  if (typeof options.attemptNumber !== 'number') throw new Error('sendSystemStripeWebhookFailed requires attemptNumber.');
  if (typeof options.maxAttempts !== 'number') throw new Error('sendSystemStripeWebhookFailed requires maxAttempts.');
  if (!options.lastResponseCode) throw new Error('sendSystemStripeWebhookFailed requires lastResponseCode.');
  if (!options.errorSummary) throw new Error('sendSystemStripeWebhookFailed requires errorSummary.');
}

export async function sendSystemStripeWebhookFailed(options: StripeWebhookFailureOptions) {
  ensurePayload(options);

  const occurredAt = options.occurredAt ?? formatter.format(new Date());
  const environment = options.environment ?? 'production';

  const html = await renderEmail(
    <SystemStripeWebhookFailedEmail
      incidentId={options.incidentId}
      environment={environment}
      occurredAt={occurredAt}
      endpoint={options.endpoint}
      eventId={options.eventId}
      eventType={options.eventType}
      attemptNumber={options.attemptNumber}
      maxAttempts={options.maxAttempts}
      lastResponseCode={options.lastResponseCode}
      errorSummary={options.errorSummary}
      suppressionRisk={options.suppressionRisk}
      actionItems={options.actionItems ?? []}
      metadata={options.metadata}
      payloadSnippet={options.payloadSnippet}
      dashboards={options.dashboards}
      escalationNotes={options.escalationNotes}
    />,
  );

  const to = options.to ?? 'ops@bunks.com';
  const subject = options.subjectOverride ?? `[Stripe Webhook Failed] ${options.eventType}`;

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
