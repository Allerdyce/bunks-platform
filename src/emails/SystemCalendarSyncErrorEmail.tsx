import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface CalendarActionItem {
  label: string;
  detail: string;
  owner?: string;
  severity?: 'low' | 'medium' | 'high';
  etaMinutes?: number;
}

export interface CalendarMetadataItem {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}

export interface CalendarSnapshotItem {
  label: string;
  value: string;
  helper?: string;
  status?: 'ok' | 'warning' | 'error';
}

export interface CalendarFeedIssue {
  platform: string;
  feedUrl: string;
  lastSuccess: string;
  failureWindow: string;
  errorCode: string;
  errorDetail: string;
  replayHref?: string;
}

export interface ImpactedBookingItem {
  guestName: string;
  stayDates: string;
  status: 'unblocked' | 'double-booked-risk' | 'pending-review';
  note?: string;
}

export interface SystemCalendarSyncErrorEmailProps {
  incidentId: string;
  environment: string;
  propertyName: string;
  propertyLocation?: string;
  channel: 'Airbnb' | 'VRBO' | 'Direct' | string;
  occurredAt: string;
  statusLabel?: string;
  summary: string;
  summaryDetail?: string;
  actionItems: CalendarActionItem[];
  metadata?: CalendarMetadataItem[];
  feedIssues: CalendarFeedIssue[];
  snapshot?: CalendarSnapshotItem[];
  impactedBookings?: ImpactedBookingItem[];
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

const actionSeverityBadge: Record<NonNullable<CalendarActionItem['severity']>, { bg: string; color: string; border: string }> = {
  low: { bg: '#ECFDF3', color: '#027A48', border: '#ABEFC6' },
  medium: { bg: '#FEF4E6', color: '#B54708', border: '#FDDCAB' },
  high: { bg: '#FEF3F2', color: '#B42318', border: '#F9C6C0' },
};

const snapshotStatusChip: Record<NonNullable<CalendarSnapshotItem['status']>, { label: string; color: string }> = {
  ok: { label: 'Healthy', color: '#027A48' },
  warning: { label: 'Warning', color: '#B54708' },
  error: { label: 'Error', color: '#B42318' },
};

const bookingStatusChip: Record<ImpactedBookingItem['status'], { label: string; color: string }> = {
  unblocked: { label: 'Unblocked', color: '#027A48' },
  'double-booked-risk': { label: 'Double-book risk', color: '#B54708' },
  'pending-review': { label: 'Pending review', color: '#7F56D9' },
};

export function SystemCalendarSyncErrorEmail(props: SystemCalendarSyncErrorEmailProps) {
  const {
    incidentId,
    environment,
    propertyName,
    propertyLocation,
    channel,
    occurredAt,
    statusLabel,
    summary,
    summaryDetail,
    actionItems,
    metadata,
    feedIssues,
    snapshot,
    impactedBookings,
    escalationNotes,
    dashboards,
  } = props;

  return (
    <EmailLayout previewText={`Calendar sync failure · ${propertyName}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Calendar sync error</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {channel} feed failed for {propertyName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">{summary}</Text>
        {summaryDetail ? <Text className="mt-1 text-sm text-[#475467]">{summaryDetail}</Text> : null}
        <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={pillStyle}>Incident {incidentId}</span>
          <span style={pillStyle}>{environment}</span>
          <span style={pillStyle}>{occurredAt}</span>
          <span style={pillStyle}>{channel}</span>
          {statusLabel ? <span style={pillStyle}>{statusLabel}</span> : null}
        </div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          Property context
        </Heading>
        <div className="space-y-2 text-sm text-[#475467]">
          <Text>
            <strong className="text-[#101828]">Property:</strong> {propertyName}
            {propertyLocation ? ` · ${propertyLocation}` : ''}
          </Text>
          <Text>
            <strong className="text-[#101828]">Channel:</strong> {channel}
          </Text>
        </div>
      </Section>

      {snapshot?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">Sync snapshot</Heading>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            {snapshot.map((item) => (
              <div key={item.label} style={{ border: '1px solid #F2F4F7', borderRadius: 14, padding: '12px 14px' }}>
                <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">{item.label}</Text>
                <Text className="text-2xl font-semibold text-[#101828] mt-1">{item.value}</Text>
                {item.helper ? <Text className="text-xs text-[#667085] mt-1">{item.helper}</Text> : null}
                {item.status ? (
                  <Text className="text-xs font-semibold" style={{ color: snapshotStatusChip[item.status].color, marginTop: 6 }}>
                    {snapshotStatusChip[item.status].label}
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
                  {typeof item.etaMinutes === 'number' ? <span>ETA {item.etaMinutes}m</span> : null}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {feedIssues.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Feed diagnostics
          </Heading>
          <div className="space-y-3">
            {feedIssues.map((issue) => (
              <div key={issue.feedUrl} style={{ border: '1px solid #E4E7EC', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <Text className="text-base font-semibold text-[#101828]">{issue.platform}</Text>
                  <Text className="text-sm text-[#98A2B3]">{issue.failureWindow}</Text>
                </div>
                <Text className="text-sm text-[#475467] mt-1">{issue.errorDetail}</Text>
                <div style={{ fontSize: 12, color: '#98A2B3', marginTop: 8 }}>
                  <div>Feed: {issue.feedUrl}</div>
                  <div>Last success: {issue.lastSuccess}</div>
                  <div>Error code: {issue.errorCode}</div>
                </div>
                {issue.replayHref ? (
                  <a href={issue.replayHref} style={{ color: '#7F56D9', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginTop: 10, display: 'inline-flex', gap: 4 }}>
                    Replay import
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {impactedBookings?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Impacted bookings
          </Heading>
          <div className="space-y-2">
            {impactedBookings.map((booking) => (
              <Row key={booking.guestName + booking.stayDates} style={{ borderBottom: '1px solid #F2F4F7', padding: '10px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '40%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{booking.guestName}</Text>
                  <Text className="text-sm text-[#98A2B3]">{booking.stayDates}</Text>
                </Column>
                <Column style={{ width: '60%' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: bookingStatusChip[booking.status].color }}>{bookingStatusChip[booking.status].label}</span>
                  {booking.note ? <Text className="text-sm text-[#475467] mt-1">{booking.note}</Text> : null}
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
        Incident {incidentId} · Generated automatically whenever an external calendar feed fails so ops can clear double-booking risk fast.
      </Text>
    </EmailLayout>
  );
}

export default SystemCalendarSyncErrorEmail;
