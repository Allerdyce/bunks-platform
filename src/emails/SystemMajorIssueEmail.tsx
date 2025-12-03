import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface MajorIssueActionItem {
  label: string;
  detail: string;
  owner?: string;
  etaMinutes?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface MajorIssueMetadataItem {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}

export interface MajorIssueTimelineItem {
  time: string;
  label: string;
  detail?: string;
  status?: 'complete' | 'in-progress' | 'pending';
}

export interface MajorIssueResponder {
  name: string;
  role: string;
  eta?: string;
  contact?: string;
  assignment?: string;
}

export interface MajorIssueAttachment {
  label: string;
  href: string;
  description?: string;
}

export interface SystemMajorIssueEmailProps {
  incidentId: string;
  severity: 'high' | 'critical';
  category: 'safety' | 'amenity' | 'security' | 'cleanliness' | 'infrastructure' | string;
  environment: string;
  reportedAt: string;
  slaCountdown?: string;
  bookingRef?: string;
  propertyName: string;
  propertyLocation?: string;
  guestName?: string;
  issueSummary: string;
  issueDetail?: string;
  immediateImpact?: string;
  statusLabel?: string;
  actionItems: MajorIssueActionItem[];
  metadata?: MajorIssueMetadataItem[];
  timeline?: MajorIssueTimelineItem[];
  responders?: MajorIssueResponder[];
  attachments?: MajorIssueAttachment[];
  escalationNotes?: string;
  dashboards?: { label: string; href: string }[];
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

const severityBadge: Record<'high' | 'critical', { bg: string; border: string; color: string; label: string }> = {
  high: { bg: '#FEF3F2', border: '#F9C6C0', color: '#B42318', label: 'High severity' },
  critical: { bg: '#FDF2FA', border: '#F9D8EE', color: '#C11574', label: 'Critical severity' },
};

const actionSeverityBadge: Record<NonNullable<MajorIssueActionItem['severity']>, { bg: string; border: string; color: string }> = {
  low: { bg: '#ECFDF3', border: '#ABEFC6', color: '#027A48' },
  medium: { bg: '#FEF4E6', border: '#FDDCAB', color: '#B54708' },
  high: { bg: '#FEF3F2', border: '#F9C6C0', color: '#B42318' },
  critical: { bg: '#FDF2FA', border: '#F9D8EE', color: '#C11574' },
};

const timelineStatusTheme: Record<NonNullable<MajorIssueTimelineItem['status']>, { color: string; label: string }> = {
  complete: { color: '#027A48', label: 'Complete' },
  'in-progress': { color: '#B54708', label: 'In progress' },
  pending: { color: '#98A2B3', label: 'Pending' },
};

export function SystemMajorIssueEmail(props: SystemMajorIssueEmailProps) {
  const {
    incidentId,
    severity,
    category,
    environment,
    reportedAt,
    slaCountdown,
    bookingRef,
    propertyName,
    propertyLocation,
    guestName,
    issueSummary,
    issueDetail,
    immediateImpact,
    statusLabel,
    actionItems,
    metadata,
    timeline,
    responders,
    attachments,
    escalationNotes,
    dashboards,
  } = props;

  const severityToken = severityBadge[severity];

  return (
    <EmailLayout previewText={`Major issue · ${propertyName}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Major issue reported</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {issueSummary}
        </Heading>
        {issueDetail ? <Text className="mt-3 text-sm text-[#475467]">{issueDetail}</Text> : null}
        {immediateImpact ? (
          <Text className="mt-2 text-sm text-[#B42318] font-semibold">Impact: {immediateImpact}</Text>
        ) : null}
        <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...pillStyle, borderColor: severityToken.border, background: severityToken.bg, color: severityToken.color }}>{severityToken.label}</span>
          <span style={pillStyle}>Incident {incidentId}</span>
          <span style={pillStyle}>{category}</span>
          <span style={pillStyle}>{environment}</span>
          <span style={pillStyle}>{reportedAt}</span>
          {slaCountdown ? <span style={pillStyle}>SLA: {slaCountdown}</span> : null}
          {statusLabel ? <span style={pillStyle}>{statusLabel}</span> : null}
        </div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          Incident context
        </Heading>
        <div className="space-y-2 text-sm text-[#475467]">
          <Text>
            <strong className="text-[#101828]">Property:</strong> {propertyName}
            {propertyLocation ? ` · ${propertyLocation}` : ''}
          </Text>
          {guestName ? (
            <Text>
              <strong className="text-[#101828]">Guest:</strong> {guestName}
            </Text>
          ) : null}
          {bookingRef ? (
            <Text>
              <strong className="text-[#101828]">Booking:</strong> {bookingRef}
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
                        borderColor: actionSeverityBadge[item.severity].border,
                        background: actionSeverityBadge[item.severity].bg,
                        color: actionSeverityBadge[item.severity].color,
                        fontSize: 11,
                      }}
                    >
                      {item.severity} priority
                    </span>
                  ) : null}
                </div>
                <Text className="mt-1 text-sm text-[#475467]">{item.detail}</Text>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, color: '#98A2B3', fontSize: 12 }}>
                  {item.owner ? <span>Owner: {item.owner}</span> : null}
                  {typeof item.etaMinutes === 'number' ? <span>ETA: {item.etaMinutes}m</span> : null}
                </div>
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

      {timeline?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Timeline
          </Heading>
          <div className="space-y-3">
            {timeline.map((item) => (
              <div key={`${item.time}-${item.label}`} style={{ borderLeft: '3px solid #D0D5DD', paddingLeft: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <Text className="text-sm text-[#98A2B3] uppercase tracking-[0.2em]">{item.time}</Text>
                  {item.status ? (
                    <span style={{ fontSize: 12, color: timelineStatusTheme[item.status].color, fontWeight: 600 }}>
                      {timelineStatusTheme[item.status].label}
                    </span>
                  ) : null}
                </div>
                <Text className="text-base font-semibold text-[#101828] mt-1">{item.label}</Text>
                {item.detail ? <Text className="text-sm text-[#475467] mt-1">{item.detail}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {responders?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Responders
          </Heading>
          <div className="space-y-2">
            {responders.map((responder) => (
              <Row key={responder.name} style={{ borderBottom: '1px solid #F2F4F7', padding: '10px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '40%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{responder.name}</Text>
                  <Text className="text-sm text-[#98A2B3]">{responder.role}</Text>
                </Column>
                <Column style={{ width: '60%' }}>
                  {responder.assignment ? (
                    <Text className="text-sm text-[#101828]">{responder.assignment}</Text>
                  ) : null}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#475467', marginTop: 6 }}>
                    {responder.eta ? <span>ETA {responder.eta}</span> : null}
                    {responder.contact ? <span>{responder.contact}</span> : null}
                  </div>
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {attachments?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Evidence
          </Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attachments.map((attachment) => (
              <a
                key={attachment.href}
                href={attachment.href}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid #E4E7EC',
                  borderRadius: 12,
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: '#7F56D9',
                  fontWeight: 600,
                }}
              >
                <span>
                  {attachment.label}
                  {attachment.description ? (
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#6941C6' }}>{attachment.description}</span>
                  ) : null}
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </Section>
      ) : null}

      {dashboards?.length || escalationNotes ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Follow-up
          </Heading>
          {dashboards?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dashboards.map((dash) => (
                <a
                  key={dash.href}
                  href={dash.href}
                  style={{
                    display: 'inline-flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #E4E7EC',
                    borderRadius: 999,
                    padding: '10px 18px',
                    color: '#7F56D9',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  {dash.label}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          ) : null}
          {escalationNotes ? <Text className="mt-3 text-sm text-[#475467]">{escalationNotes}</Text> : null}
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Incident {incidentId} · Auto-generated whenever a guest or host flags a critical issue so ops can coordinate a rapid response.
      </Text>
    </EmailLayout>
  );
}

export default SystemMajorIssueEmail;
