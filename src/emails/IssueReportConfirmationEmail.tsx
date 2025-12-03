import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface IssueEvidenceItem {
  label: string;
  value: string;
}

export interface IssueReportConfirmationEmailProps {
  guestName: string;
  propertyName: string;
  ticketId: string;
  submittedAt: string;
  summary: string;
  severity: 'low' | 'medium' | 'high';
  location?: string;
  etaMinutes?: number;
  assignedTo?: string;
  nextSteps?: string[];
  evidence?: IssueEvidenceItem[];
  support: {
    email: string;
    phone?: string;
    concierge?: string;
    escalationNote?: string;
  };
  safetyContact?: {
    label: string;
    value: string;
  };
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 18,
  padding: '20px 22px',
  background: '#FFFFFF',
};

const severityColors: Record<IssueReportConfirmationEmailProps['severity'], { text: string; background: string; border: string }> = {
  low: { text: '#027A48', background: '#ECFDF3', border: '#ABEFC6' },
  medium: { text: '#B54708', background: '#FEF0C7', border: '#FEDF89' },
  high: { text: '#B42318', background: '#FEE4E2', border: '#FECDCA' },
};

export function IssueReportConfirmationEmail(props: IssueReportConfirmationEmailProps) {
  const {
    guestName,
    propertyName,
    ticketId,
    submittedAt,
    summary,
    severity,
    location,
    etaMinutes,
    assignedTo,
    nextSteps,
    evidence,
    support,
    safetyContact,
  } = props;

  const severityStyle = severityColors[severity];

  return (
    <EmailLayout previewText={`We logged your ${propertyName} support ticket ${ticketId}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Issue received</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Thanks for flagging this, {guestName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Ticket <strong>{ticketId}</strong> is now with our concierge ops team. We’ll keep you posted as we work through it.
        </Text>
        <div
          style={{
            display: 'inline-flex',
            marginTop: 16,
            padding: '6px 14px',
            borderRadius: 999,
            border: `1px solid ${severityStyle.border}`,
            background: severityStyle.background,
            color: severityStyle.text,
            fontWeight: 600,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {severity} priority
        </div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          What you reported
        </Heading>
        <Text className="text-sm text-[#475467]">
          {submittedAt} · {propertyName}
        </Text>
        {location && (
          <Text className="text-sm text-[#475467] mt-1">
            Location: <strong>{location}</strong>
          </Text>
        )}
        <Text className="text-base text-[#101828] mt-3">{summary}</Text>
        {evidence?.length ? (
          <div className="mt-4 space-y-2">
            {evidence.map((item) => (
              <Text key={item.label} className="text-sm text-[#475467]">
                <strong>{item.label}:</strong> {item.value}
              </Text>
            ))}
          </div>
        ) : null}
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Row>
          <Column style={{ width: '50%', minWidth: 240, paddingRight: 8, paddingBottom: 12 }}>
            <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
              Our response
            </Heading>
            {assignedTo && (
              <Text className="text-sm text-[#475467]">
                <strong>Assigned to:</strong> {assignedTo}
              </Text>
            )}
            {typeof etaMinutes === 'number' && (
              <Text className="text-sm text-[#475467] mt-1">
                <strong>ETA:</strong> {etaMinutes} minutes
              </Text>
            )}
            <Text className="text-sm text-[#475467] mt-2">
              We’ll text/email updates as soon as the fix is confirmed.
            </Text>
          </Column>
          <Column style={{ width: '50%', minWidth: 240, paddingLeft: 8, paddingBottom: 12 }}>
            <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
              Next steps
            </Heading>
            {nextSteps?.length ? (
              <ul className="list-disc pl-5 text-sm text-[#475467]">
                {nextSteps.map((step) => (
                  <li key={step} className="mb-1">{step}</li>
                ))}
              </ul>
            ) : (
              <Text className="text-sm text-[#475467]">No action needed—we’ll handle the rest.</Text>
            )}
          </Column>
        </Row>
      </Section>

      {safetyContact ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#FEF3F2' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#B42318] mb-2">
            Urgent or safety-related?
          </Heading>
          <Text className="text-sm text-[#B42318]">
            Call {safetyContact.label}: <a href={`tel:${safetyContact.value}`} className="text-[#B42318]">{safetyContact.value}</a>. Dial emergency services first if there’s immediate danger.
          </Text>
        </Section>
      ) : null}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Need more help?
        </Heading>
        <Text className="text-sm text-[#475467]">
          Email <a href={`mailto:${support.email}`} className="text-[#7F56D9]">{support.email}</a>
          {support.phone ? (
            <>
              {' '}or text <a href={`tel:${support.phone}`} className="text-[#7F56D9]">{support.phone}</a>
            </>
          ) : null}
          {support.concierge ? (
            <>
              {' '}· concierge line <a href={`tel:${support.concierge}`} className="text-[#7F56D9]">{support.concierge}</a>
            </>
          ) : null}
          .
        </Text>
        {support.escalationNote && (
          <Text className="mt-2 text-sm text-[#475467]">{support.escalationNote}</Text>
        )}
      </Section>

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Ticket #{ticketId} · We monitor replies 24/7 and respond within minutes during active stays.
      </Text>
    </EmailLayout>
  );
}

export default IssueReportConfirmationEmail;
