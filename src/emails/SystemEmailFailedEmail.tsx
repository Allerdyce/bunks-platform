import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface FailureActionItem {
  label: string;
  detail: string;
  owner?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface FailureMetadataItem {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}

export interface SystemEmailFailedEmailProps {
  incidentId: string;
  environment: string;
  occurredAt: string;
  recipient: string;
  originalSubject?: string;
  stream?: string;
  bounceType: string;
  bounceSubtype?: string;
  description: string;
  suppressionReason?: string;
  messageId?: string;
  triggeredBy?: string;
  actionItems: FailureActionItem[];
  metadata?: FailureMetadataItem[];
  relatedLogsUrl?: string;
  escalationNotes?: string;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 18,
  padding: '20px 22px',
  background: '#FFFFFF',
};

const pillStyle: React.CSSProperties = {
  borderRadius: 999,
  border: '1px solid #D0D5DD',
  background: '#F8F9FC',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
};

const severityBadge: Record<NonNullable<FailureActionItem['severity']>, { bg: string; color: string; border: string }> = {
  low: { bg: '#ECFDF3', color: '#027A48', border: '#ABEFC6' },
  medium: { bg: '#FEF4E6', color: '#B54708', border: '#FDDCAB' },
  high: { bg: '#FEF3F2', color: '#B42318', border: '#F9C6C0' },
};

export function SystemEmailFailedEmail(props: SystemEmailFailedEmailProps) {
  const {
    incidentId,
    environment,
    occurredAt,
    recipient,
    originalSubject,
    stream,
    bounceType,
    bounceSubtype,
    description,
    suppressionReason,
    messageId,
    triggeredBy,
    actionItems,
    metadata,
    relatedLogsUrl,
    escalationNotes,
  } = props;

  return (
    <EmailLayout previewText={`Email failure alert · ${recipient}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Delivery failure</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Email bounced for {recipient}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Postmark flagged a {bounceType.toLowerCase()} event. Review the details below and follow the checklist so the guest or host hears from us quickly.
        </Text>
        <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={pillStyle}>Incident {incidentId}</span>
          <span style={pillStyle}>{environment}</span>
          <span style={pillStyle}>{occurredAt}</span>
        </div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          Failure summary
        </Heading>
        <div className="space-y-2 text-sm text-[#475467]">
          <Text>
            <strong className="text-[#101828]">Recipient:</strong> {recipient}
          </Text>
          {originalSubject ? (
            <Text>
              <strong className="text-[#101828]">Original subject:</strong> {originalSubject}
            </Text>
          ) : null}
          <Text>
            <strong className="text-[#101828]">Bounce type:</strong> {bounceType}
            {bounceSubtype ? ` · ${bounceSubtype}` : ''}
          </Text>
          {stream ? (
            <Text>
              <strong className="text-[#101828]">Message stream:</strong> {stream}
            </Text>
          ) : null}
          <Text>
            <strong className="text-[#101828]">Description:</strong> {description}
          </Text>
          {suppressionReason ? (
            <Text>
              <strong className="text-[#101828]">Suppression:</strong> {suppressionReason}
            </Text>
          ) : null}
          {messageId ? (
            <Text>
              <strong className="text-[#101828]">Postmark ID:</strong> {messageId}
            </Text>
          ) : null}
          {triggeredBy ? (
            <Text>
              <strong className="text-[#101828]">Triggered by:</strong> {triggeredBy}
            </Text>
          ) : null}
        </div>
      </Section>

      {actionItems.length ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#F8F9FC' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Action checklist
          </Heading>
          <div className="space-y-3">
            {actionItems.map((item) => (
              <div key={item.label} style={{ border: '1px solid #E4E7EC', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                  {item.severity ? (
                    <span
                      style={{
                        ...pillStyle,
                        background: severityBadge[item.severity].bg,
                        color: severityBadge[item.severity].color,
                        borderColor: severityBadge[item.severity].border,
                      }}
                    >
                      {item.severity} priority
                    </span>
                  ) : null}
                </div>
                <Text className="mt-1 text-sm text-[#475467]">{item.detail}</Text>
                {item.owner ? (
                  <Text className="mt-1 text-xs text-[#98A2B3]">Owner: {item.owner}</Text>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {metadata?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Metadata
          </Heading>
          <div className="space-y-2">
            {metadata.map((item) => (
              <Row key={item.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '40%' }}>
                  <Text className="text-sm text-[#98A2B3] uppercase tracking-[0.2em]">{item.label}</Text>
                </Column>
                <Column style={{ width: '60%' }}>
                  {item.href ? (
                    <a href={item.href} className="text-sm text-[#7F56D9]">
                      {item.value}
                    </a>
                  ) : (
                    <Text className="text-sm text-[#101828]">{item.value}</Text>
                  )}
                  {item.hint ? <Text className="text-xs text-[#98A2B3]">{item.hint}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {relatedLogsUrl || escalationNotes ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Follow-up
          </Heading>
          {relatedLogsUrl ? (
            <a
              href={relatedLogsUrl}
              style={{
                display: 'inline-block',
                background: '#7F56D9',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: 999,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Open bounce logs
            </a>
          ) : null}
          {escalationNotes ? <Text className="mt-3 text-sm text-[#475467]">{escalationNotes}</Text> : null}
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Incident {incidentId} · Auto-generated from Postmark bounce webhook so ops can respond immediately.
      </Text>
    </EmailLayout>
  );
}

export default SystemEmailFailedEmail;
