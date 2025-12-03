import * as React from 'react';
import { SystemCronSummaryEmail, type SystemCronSummaryEmailProps } from '@/emails/SystemCronSummaryEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'SYSTEM_CRON_SUMMARY' as const;

const statusSubjectLabel: Record<SystemCronSummaryEmailProps['status'], string> = {
  healthy: 'healthy',
  degraded: 'degraded',
  failed: 'failed',
};

type SendSystemCronSummaryOptions = SystemCronSummaryEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendSystemCronSummaryOptions) {
  if (!options.runId) {
    throw new Error('sendSystemCronSummary requires runId.');
  }
  if (!options.cronName) {
    throw new Error('sendSystemCronSummary requires cronName.');
  }
  if (!options.startedAt) {
    throw new Error('sendSystemCronSummary requires startedAt.');
  }
  if (!options.duration) {
    throw new Error('sendSystemCronSummary requires duration.');
  }
  if (!options.summary) {
    throw new Error('sendSystemCronSummary requires summary copy.');
  }
  if (!options.metrics?.length) {
    throw new Error('sendSystemCronSummary requires at least one metric.');
  }
  if (!options.jobResults?.length) {
    throw new Error('sendSystemCronSummary requires at least one job result.');
  }
}

export async function sendSystemCronSummary(options: SendSystemCronSummaryOptions) {
  ensurePayload(options);

  const environment = options.environment ?? 'production';
  const status = options.status ?? 'healthy';

  const html = await renderEmail(
    <SystemCronSummaryEmail
      runId={options.runId}
      cronName={options.cronName}
      environment={environment}
      startedAt={options.startedAt}
      completedAt={options.completedAt}
      duration={options.duration}
      status={status}
      summary={options.summary}
      summaryDetail={options.summaryDetail}
      metrics={options.metrics}
      jobResults={options.jobResults}
      incidents={options.incidents}
      backlog={options.backlog}
      followUpLinks={options.followUpLinks}
      operatorNotes={options.operatorNotes}
      nextRunWindow={options.nextRunWindow}
    />,
  );

  const to = options.to ?? 'ops@bunks.com';
  const subject = options.subjectOverride ?? `[Cron] ${options.cronName} · ${statusSubjectLabel[status]} run`;

  const logResult = async (logStatus: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId: options.bookingId,
      to: Array.isArray(to) ? to.join(',') : to,
      type: EMAIL_TYPE,
      status: logStatus,
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
