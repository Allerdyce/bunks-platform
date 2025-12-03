import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface PaymentActionItem {
  label: string;
  detail: string;
  owner?: string;
  severity?: 'info' | 'warning' | 'high' | 'critical';
  etaMinutes?: number;
  followUpHref?: string;
}

export interface PaymentMetricItem {
  label: string;
  value: string;
  helper?: string;
  status?: 'healthy' | 'warning' | 'critical';
}

export interface PaymentLedgerAdjustment {
  label: string;
  amount: string;
  direction: 'credit' | 'debit';
  note?: string;
}

type PaymentImpactStream = 'guest_charge' | 'host_payout' | 'fees' | 'manual' | 'requires-review' | 'other';

export interface PaymentImpactItem {
  label: string;
  amount: string;
  stream: PaymentImpactStream;
  status: 'held' | 'refunded' | 'manual' | 'requires-review';
  note?: string;
}

export interface PaymentMetadataItem {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}

export interface PaymentTimelineItem {
  time: string;
  label: string;
  detail?: string;
  status?: 'complete' | 'in-progress' | 'pending';
}

export interface PaymentAttachmentLink {
  label: string;
  href: string;
  description?: string;
}

export interface PaymentDashboardLink {
  label: string;
  href: string;
  description?: string;
}

export interface SystemPaymentExceptionEmailProps {
  incidentId: string;
  environment: string;
  anomalyType: string;
  severityLabel?: string;
  occurredAt: string;
  summary: string;
  summaryDetail?: string;
  bookingRef?: string;
  guestName?: string;
  propertyName?: string;
  propertyLocation?: string;
  paymentMethod?: string;
  paymentAmount?: string;
  processor?: string;
  actionItems: PaymentActionItem[];
  metrics?: PaymentMetricItem[];
  ledgerAdjustments?: PaymentLedgerAdjustment[];
  impactedFlows?: PaymentImpactItem[];
  metadata?: PaymentMetadataItem[];
  timeline?: PaymentTimelineItem[];
  attachments?: PaymentAttachmentLink[];
  dashboards?: PaymentDashboardLink[];
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

const actionSeverityMap: Record<NonNullable<PaymentActionItem['severity']>, { bg: string; color: string; border: string; label: string }> = {
  info: { bg: '#EEF4FF', color: '#3538CD', border: '#C7D7FE', label: 'Info' },
  warning: { bg: '#FEF4E6', color: '#B54708', border: '#FDDCAB', label: 'Warning' },
  high: { bg: '#FEF3F2', color: '#B42318', border: '#F9C6C0', label: 'High' },
  critical: { bg: '#FEF3F2', color: '#B42318', border: '#F9C6C0', label: 'Critical' },
};

const metricStatusChip: Record<NonNullable<PaymentMetricItem['status']>, { color: string; label: string }> = {
  healthy: { color: '#027A48', label: 'Healthy' },
  warning: { color: '#B54708', label: 'Warning' },
  critical: { color: '#B42318', label: 'Critical' },
};

const impactStreamChip: Record<PaymentImpactStream, { bg: string; color: string }> = {
  guest_charge: { bg: '#EEF4FF', color: '#3538CD' },
  host_payout: { bg: '#F4EBFF', color: '#7F56D9' },
  fees: { bg: '#ECFDF3', color: '#027A48' },
  manual: { bg: '#FFF6ED', color: '#B93815' },
  'requires-review': { bg: '#FEF3F2', color: '#B42318' },
  other: { bg: '#F2F4F7', color: '#475467' },
};

const impactStatusChip: Record<PaymentImpactItem['status'], { color: string; label: string }> = {
  held: { color: '#B54708', label: 'Held' },
  refunded: { color: '#027A48', label: 'Refunded' },
  manual: { color: '#7F56D9', label: 'Manual action' },
  'requires-review': { color: '#B42318', label: 'Requires review' },
};

const timelineStatusChip: Record<NonNullable<PaymentTimelineItem['status']>, { color: string; label: string }> = {
  complete: { color: '#027A48', label: 'Complete' },
  'in-progress': { color: '#B54708', label: 'In progress' },
  pending: { color: '#667085', label: 'Pending' },
};

export function SystemPaymentExceptionEmail(props: SystemPaymentExceptionEmailProps) {
  const {
    incidentId,
    environment,
    anomalyType,
    severityLabel,
    occurredAt,
    summary,
    summaryDetail,
    bookingRef,
    guestName,
    propertyName,
    propertyLocation,
    paymentMethod,
    paymentAmount,
    processor,
    actionItems,
    metrics,
    ledgerAdjustments,
    impactedFlows,
    metadata,
    timeline,
    attachments,
    dashboards,
    escalationNotes,
  } = props;

  const preview = bookingRef || propertyName ? `Payment exception · ${bookingRef ?? propertyName}` : `Payment exception ${incidentId}`;

  return (
    <EmailLayout previewText={preview}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Payment exception detected</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Finance follow-up required
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">{summary}</Text>
        {summaryDetail ? <Text className="mt-1 text-sm text-[#475467]">{summaryDetail}</Text> : null}
        <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={pillStyle}>Incident {incidentId}</span>
          <span style={pillStyle}>{environment}</span>
          <span style={pillStyle}>{occurredAt}</span>
          <span style={pillStyle}>{anomalyType}</span>
          {severityLabel ? <span style={{ ...pillStyle, borderColor: '#F9C6C0', color: '#B42318' }}>{severityLabel}</span> : null}
        </div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          Financial snapshot
        </Heading>
        <div className="space-y-2 text-sm text-[#475467]">
          {paymentAmount ? (
            <Text>
              <strong className="text-[#101828]">Amount:</strong> {paymentAmount}
            </Text>
          ) : null}
          {paymentMethod ? (
            <Text>
              <strong className="text-[#101828]">Method:</strong> {paymentMethod}
            </Text>
          ) : null}
          {processor ? (
            <Text>
              <strong className="text-[#101828]">Processor:</strong> {processor}
            </Text>
          ) : null}
          {bookingRef ? (
            <Text>
              <strong className="text-[#101828]">Booking:</strong> {bookingRef}
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
              {propertyLocation ? ` · ${propertyLocation}` : ''}
            </Text>
          ) : null}
        </div>
      </Section>

      {metrics?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Exception metrics
          </Heading>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            {metrics.map((metric) => (
              <div key={metric.label} style={{ border: '1px solid #F2F4F7', borderRadius: 14, padding: '12px 14px' }}>
                <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">{metric.label}</Text>
                <Text className="text-2xl font-semibold text-[#101828] mt-1">{metric.value}</Text>
                {metric.helper ? <Text className="text-xs text-[#667085] mt-1">{metric.helper}</Text> : null}
                {metric.status ? (
                  <Text className="text-xs font-semibold" style={{ color: metricStatusChip[metric.status].color, marginTop: 6 }}>
                    {metricStatusChip[metric.status].label}
                  </Text>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {actionItems.length ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#F8F9FC' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Action plan
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
                        borderColor: actionSeverityMap[item.severity].border,
                        background: actionSeverityMap[item.severity].bg,
                        color: actionSeverityMap[item.severity].color,
                        fontSize: 11,
                      }}
                    >
                      {actionSeverityMap[item.severity].label}
                    </span>
                  ) : null}
                </div>
                <Text className="mt-1 text-sm text-[#475467]">{item.detail}</Text>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, color: '#98A2B3', fontSize: 12 }}>
                  {item.owner ? <span>Owner: {item.owner}</span> : null}
                  {typeof item.etaMinutes === 'number' ? <span>ETA {item.etaMinutes}m</span> : null}
                  {item.followUpHref ? (
                    <a href={item.followUpHref} style={{ color: '#7F56D9', textDecoration: 'none' }}>
                      Playbook ↗
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {impactedFlows?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Impacted flows
          </Heading>
          <div className="space-y-2">
            {impactedFlows.map((impact) => {
              const streamChip = impactStreamChip[impact.stream as keyof typeof impactStreamChip];
              return (
              <Row key={impact.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '10px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '45%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span
                      style={{
                        ...pillStyle,
                          borderColor: streamChip?.bg ?? '#E4E7EC',
                          background: streamChip?.bg ?? '#F8F9FC',
                          color: streamChip?.color ?? '#475467',
                        fontSize: 11,
                      }}
                    >
                        {impact.stream.replace(/[-_]/g, ' ')}
                    </span>
                    <Text className="text-base font-semibold text-[#101828]">{impact.label}</Text>
                    <Text className="text-sm text-[#475467]">{impact.amount}</Text>
                  </div>
                </Column>
                <Column style={{ width: '55%' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: impactStatusChip[impact.status].color }}>
                    {impactStatusChip[impact.status].label}
                  </span>
                  {impact.note ? <Text className="text-sm text-[#475467] mt-1">{impact.note}</Text> : null}
                </Column>
              </Row>
              );
            })}
          </div>
        </Section>
      ) : null}

      {ledgerAdjustments?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Ledger adjustments
          </Heading>
          <div className="space-y-2">
            {ledgerAdjustments.map((entry) => (
              <Row key={entry.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '10px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '50%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{entry.label}</Text>
                  {entry.note ? <Text className="text-sm text-[#475467]">{entry.note}</Text> : null}
                </Column>
                <Column style={{ width: '50%', textAlign: 'right' }}>
                  <Text
                    className="text-base font-semibold"
                    style={{ color: entry.direction === 'credit' ? '#027A48' : '#B42318' }}
                  >
                    {entry.direction === 'credit' ? '+' : '-'} {entry.amount}
                  </Text>
                </Column>
              </Row>
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
              <div key={item.time + item.label} style={{ borderLeft: '2px solid #E4E7EC', paddingLeft: 16 }}>
                <Text className="text-xs text-[#98A2B3]">{item.time}</Text>
                <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                {item.detail ? <Text className="text-sm text-[#475467]">{item.detail}</Text> : null}
                {item.status ? (
                  <Text className="text-xs font-semibold" style={{ color: timelineStatusChip[item.status].color, marginTop: 4 }}>
                    {timelineStatusChip[item.status].label}
                  </Text>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {(dashboards?.length || attachments?.length || escalationNotes) ? (
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
                  <span>
                    {dash.label}
                    {dash.description ? <span style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#475467' }}>{dash.description}</span> : null}
                  </span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          ) : null}
          {attachments?.length ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attachments.map((attachment) => (
                <a key={attachment.href} href={attachment.href} className="text-sm text-[#7F56D9]">
                  {attachment.label}
                  {attachment.description ? <span style={{ display: 'block', color: '#475467' }}>{attachment.description}</span> : null}
                </a>
              ))}
            </div>
          ) : null}
          {escalationNotes ? <Text className="mt-3 text-sm text-[#475467]">{escalationNotes}</Text> : null}
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Incident {incidentId} · Triggered automatically whenever Stripe flags a payment anomaly so finance can reconcile charges before payouts settle.
      </Text>
    </EmailLayout>
  );
}

export default SystemPaymentExceptionEmail;
