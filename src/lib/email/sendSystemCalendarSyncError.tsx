import * as React from 'react';
import { SystemCalendarSyncErrorEmail, type SystemCalendarSyncErrorEmailProps } from '@/emails/SystemCalendarSyncErrorEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'SYSTEM_CALENDAR_SYNC_ERROR' as const;

type SendSystemCalendarSyncErrorOptions = SystemCalendarSyncErrorEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendSystemCalendarSyncErrorOptions) {
  if (!options.incidentId) {
    throw new Error('sendSystemCalendarSyncError requires incidentId.');
  }
  if (!options.propertyName) {
    throw new Error('sendSystemCalendarSyncError requires propertyName.');
  }
  if (!options.channel) {
    throw new Error('sendSystemCalendarSyncError requires channel.');
  }
  if (!options.summary) {
    throw new Error('sendSystemCalendarSyncError requires summary.');
  }
  if (!options.feedIssues?.length) {
    throw new Error('sendSystemCalendarSyncError requires at least one feed issue.');
  }
  if (!options.actionItems?.length) {
    throw new Error('sendSystemCalendarSyncError requires at least one action item.');
  }
}

export async function sendSystemCalendarSyncError(options: SendSystemCalendarSyncErrorOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <SystemCalendarSyncErrorEmail
      incidentId={options.incidentId}
      environment={options.environment ?? 'production'}
      propertyName={options.propertyName}
      propertyLocation={options.propertyLocation}
      channel={options.channel}
      occurredAt={options.occurredAt}
      statusLabel={options.statusLabel}
      summary={options.summary}
      summaryDetail={options.summaryDetail}
      actionItems={options.actionItems}
      metadata={options.metadata}
      feedIssues={options.feedIssues}
      snapshot={options.snapshot}
      impactedBookings={options.impactedBookings}
      escalationNotes={options.escalationNotes}
      dashboards={options.dashboards}
    />,
  );

  const to = options.to ?? 'ops@bunks.com';
  const subject = options.subjectOverride ?? `[Calendar] ${options.propertyName} · ${options.channel} feed failing`;

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
