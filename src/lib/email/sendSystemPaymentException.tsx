import * as React from 'react';
import { SystemPaymentExceptionEmail, type SystemPaymentExceptionEmailProps } from '@/emails/SystemPaymentExceptionEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'SYSTEM_PAYMENT_EXCEPTION' as const;

type SendSystemPaymentExceptionOptions = SystemPaymentExceptionEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendSystemPaymentExceptionOptions) {
  if (!options.incidentId) {
    throw new Error('sendSystemPaymentException requires incidentId.');
  }
  if (!options.anomalyType) {
    throw new Error('sendSystemPaymentException requires anomalyType.');
  }
  if (!options.summary) {
    throw new Error('sendSystemPaymentException requires summary.');
  }
  if (!options.actionItems?.length) {
    throw new Error('sendSystemPaymentException requires at least one action item.');
  }
}

export async function sendSystemPaymentException(options: SendSystemPaymentExceptionOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <SystemPaymentExceptionEmail
      incidentId={options.incidentId}
      environment={options.environment ?? 'production'}
      anomalyType={options.anomalyType}
      severityLabel={options.severityLabel}
      occurredAt={options.occurredAt}
      summary={options.summary}
      summaryDetail={options.summaryDetail}
      bookingRef={options.bookingRef}
      guestName={options.guestName}
      propertyName={options.propertyName}
      propertyLocation={options.propertyLocation}
      paymentMethod={options.paymentMethod}
      paymentAmount={options.paymentAmount}
      processor={options.processor}
      actionItems={options.actionItems}
      metrics={options.metrics}
      ledgerAdjustments={options.ledgerAdjustments}
      impactedFlows={options.impactedFlows}
      metadata={options.metadata}
      timeline={options.timeline}
      attachments={options.attachments}
      dashboards={options.dashboards}
      escalationNotes={options.escalationNotes}
    />,
  );

  const to = options.to ?? 'ops@bunks.com';
  const fallbackContext = options.bookingRef ?? options.propertyName ?? options.guestName ?? options.incidentId;
  const subject = options.subjectOverride ?? `[Payments] ${options.anomalyType} · ${fallbackContext}`;

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
