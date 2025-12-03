import * as React from 'react';
import { SystemMajorIssueEmail, type SystemMajorIssueEmailProps } from '@/emails/SystemMajorIssueEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'SYSTEM_MAJOR_ISSUE' as const;

const severitySubjectLabel: Record<SystemMajorIssueEmailProps['severity'], string> = {
  high: 'High severity',
  critical: 'Critical severity',
};

type SendSystemMajorIssueOptions = SystemMajorIssueEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
  bookingId?: number;
};

function ensurePayload(options: SendSystemMajorIssueOptions) {
  if (!options.incidentId) {
    throw new Error('sendSystemMajorIssue requires incidentId.');
  }
  if (!options.issueSummary) {
    throw new Error('sendSystemMajorIssue requires issueSummary.');
  }
  if (!options.propertyName) {
    throw new Error('sendSystemMajorIssue requires propertyName.');
  }
  if (!options.actionItems?.length) {
    throw new Error('sendSystemMajorIssue requires at least one action item.');
  }
}

export async function sendSystemMajorIssue(options: SendSystemMajorIssueOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <SystemMajorIssueEmail
      incidentId={options.incidentId}
      severity={options.severity}
      category={options.category}
      environment={options.environment ?? 'production'}
      reportedAt={options.reportedAt}
      slaCountdown={options.slaCountdown}
      bookingRef={options.bookingRef}
      propertyName={options.propertyName}
      propertyLocation={options.propertyLocation}
      guestName={options.guestName}
      issueSummary={options.issueSummary}
      issueDetail={options.issueDetail}
      immediateImpact={options.immediateImpact}
      statusLabel={options.statusLabel}
      actionItems={options.actionItems}
      metadata={options.metadata}
      timeline={options.timeline}
      responders={options.responders}
      attachments={options.attachments}
      escalationNotes={options.escalationNotes}
      dashboards={options.dashboards}
    />,
  );

  const to = options.to ?? 'ops@bunks.com';
  const subject = options.subjectOverride ?? `[Issue] ${options.propertyName} · ${severitySubjectLabel[options.severity]}`;

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
