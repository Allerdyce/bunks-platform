import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface BookingFailureActionItem {
  label: string;
  detail: string;
  owner?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface BookingFailureMetadataItem {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}

export interface BookingFailureRequestContext {
  endpoint: string;
  method: string;
  statusCode: string;
  durationMs?: number;
  correlationId?: string;
  remoteIp?: string;
}

export interface BookingFailurePayloadSnippet {
  title: string;
  lines: string[];
}

export interface SystemBookingCreationFailedEmailProps {
  incidentId: string;
  environment: string;
  occurredAt: string;
  request: BookingFailureRequestContext;
  bookingReference?: string;
  guestName?: string;
  propertyName?: string;
  errorSummary: string;
  rootCauseHint?: string;
  actionItems: BookingFailureActionItem[];
  metadata?: BookingFailureMetadataItem[];
  payloadSnippet?: BookingFailurePayloadSnippet;
  dashboards?: { label: string; href: string }[];
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

const severityBadge: Record<NonNullable<BookingFailureActionItem['severity']>, { bg: string; color: string; border: string }> = {
  low: { bg: '#ECFDF3', color: '#027A48', border: '#ABEFC6' },
  medium: { bg: '#FEF4E6', color: '#B54708', border: '#FDDCAB' },
  high: { bg: '#FEF3F2', color: '#B42318', border: '#F9C6C0' },
  critical: { bg: '#FDF2FA', color: '#C11574', border: '#F9D8EE' },
};

export function SystemBookingCreationFailedEmail(props: SystemBookingCreationFailedEmailProps) {
  const {
    incidentId,
    environment,
    occurredAt,
    request,
    bookingReference,
    guestName,
    propertyName,
    errorSummary,
    rootCauseHint,
    actionItems,
    metadata,
    payloadSnippet,
    dashboards,
    escalationNotes,
  } = props;

  return (
    <EmailLayout previewText={`Booking creation failed · ${request.endpoint}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Booking pipeline alert</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Booking creation failed at {request.endpoint.replace(/^https?:\/\//, '')}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          The booking API threw an error before persisting the record. Guests may have been charged without a confirmed reservation—follow the checklist below.
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
            <strong className="text-[#101828]">Endpoint:</strong> {request.method} {request.endpoint}
          </Text>
          <Text>
            <strong className="text-[#101828]">Response:</strong> {request.statusCode}
            {request.durationMs ? ` · ${request.durationMs}ms` : ''}
          </Text>
          {request.correlationId ? (
            <Text>
              <strong className="text-[#101828]">Correlation ID:</strong> {request.correlationId}
            </Text>
          ) : null}
          {request.remoteIp ? (
            <Text>
              <strong className="text-[#101828]">Client IP:</strong> {request.remoteIp}
            </Text>
          ) : null}
          {bookingReference ? (
            <Text>
              <strong className="text-[#101828]">Booking ref:</strong> {bookingReference}
            </Text>
          ) : null}
          {guestName ? (
            <Text>
              <strong className="text-[#101828]">Guest:</strong> {guestName}
            </Text>
          ) : null}
          {propertyName ? (
            <Text>
              <strong className="text-[#101828]">Property:</strong> {propertyName}
            </Text>
          ) : null}
          <Text>
            <strong className="text-[#101828]">Error:</strong> {errorSummary}
          </Text>
          {rootCauseHint ? (
            <Text>
              <strong className="text-[#101828]">Hint:</strong> {rootCauseHint}
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

      {payloadSnippet ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Payload snapshot
          </Heading>
          <div style={{ background: '#0F172A', borderRadius: 14, padding: '16px 18px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            <Text className="text-xs uppercase tracking-[0.4em] text-[#94A3B8] mb-2">
              {payloadSnippet.title}
            </Text>
            <pre style={{ margin: 0, color: '#F8FAFC', fontSize: 12, lineHeight: '18px', whiteSpace: 'pre-wrap' }}>
              {payloadSnippet.lines.join('\n')}
            </pre>
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
        Incident {incidentId} · Generated automatically from booking pipeline monitors so we can rescue orphaned payments ASAP.
      </Text>
    </EmailLayout>
  );
}

export default SystemBookingCreationFailedEmail;
