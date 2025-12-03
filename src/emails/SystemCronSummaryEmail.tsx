import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface CronSummaryMetric {
  label: string;
  value: string;
  helper?: string;
}

export interface CronJobResult {
  jobName: string;
  window: string;
  attempted: number;
  sent: number;
  failed: number;
  skipped?: number;
  duration?: string;
  notes?: string;
  severity?: 'info' | 'warning' | 'error';
}

export interface CronIncidentItem {
  title: string;
  detail: string;
  owner?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CronBacklogItem {
  label: string;
  count: string;
  helper?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface CronFollowUpLink {
  label: string;
  href: string;
  description?: string;
}

export interface SystemCronSummaryEmailProps {
  runId: string;
  cronName: string;
  environment: string;
  startedAt: string;
  completedAt?: string;
  duration: string;
  status: 'healthy' | 'degraded' | 'failed';
  summary: string;
  summaryDetail?: string;
  metrics: CronSummaryMetric[];
  jobResults: CronJobResult[];
  incidents?: CronIncidentItem[];
  backlog?: CronBacklogItem[];
  followUpLinks?: CronFollowUpLink[];
  operatorNotes?: string;
  nextRunWindow?: string;
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

const statusBadge: Record<SystemCronSummaryEmailProps['status'], { bg: string; color: string; border: string; label: string }> = {
  healthy: { bg: '#ECFDF3', color: '#027A48', border: '#ABEFC6', label: 'Healthy run' },
  degraded: { bg: '#FEF4E6', color: '#B54708', border: '#FDDCAB', label: 'Degraded run' },
  failed: { bg: '#FEF3F2', color: '#B42318', border: '#F9C6C0', label: 'Failed run' },
};

const jobSeverityBadge: Record<NonNullable<CronJobResult['severity']>, { bg: string; color: string; border: string; label: string }> = {
  info: { bg: '#EEF2FF', color: '#3538CD', border: '#C7D7FE', label: 'Info' },
  warning: { bg: '#FEF4E6', color: '#B54708', border: '#FDDCAB', label: 'Warning' },
  error: { bg: '#FEF3F2', color: '#B42318', border: '#F9C6C0', label: 'Error' },
};

const incidentSeverityBadge: Record<NonNullable<CronIncidentItem['severity']>, { bg: string; color: string; border: string }> = {
  low: { bg: '#ECFDF3', color: '#027A48', border: '#ABEFC6' },
  medium: { bg: '#FEF4E6', color: '#B54708', border: '#FDDCAB' },
  high: { bg: '#FEF3F2', color: '#B42318', border: '#F9C6C0' },
  critical: { bg: '#FDF2FA', color: '#C11574', border: '#F9D8EE' },
};

const trendIcon: Record<NonNullable<CronBacklogItem['trend']>, string> = {
  up: '↗',
  down: '↘',
  flat: '→',
};

export function SystemCronSummaryEmail(props: SystemCronSummaryEmailProps) {
  const {
    runId,
    cronName,
    environment,
    startedAt,
    completedAt,
    duration,
    status,
    summary,
    summaryDetail,
    metrics,
    jobResults,
    incidents,
    backlog,
    followUpLinks,
    operatorNotes,
    nextRunWindow,
  } = props;

  const statusToken = statusBadge[status];

  return (
    <EmailLayout previewText={`Cron summary · ${cronName}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Cron summary</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {cronName} run complete
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">{summary}</Text>
        {summaryDetail ? <Text className="mt-1 text-sm text-[#475467]">{summaryDetail}</Text> : null}
        <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...pillStyle, borderColor: statusToken.border, background: statusToken.bg, color: statusToken.color }}>{statusToken.label}</span>
          <span style={pillStyle}>Run {runId}</span>
          <span style={pillStyle}>{environment}</span>
          <span style={pillStyle}>{startedAt}</span>
          {completedAt ? <span style={pillStyle}>{completedAt}</span> : null}
          <span style={pillStyle}>{duration}</span>
        </div>
      </Section>

      {metrics?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
            Run metrics
          </Heading>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
            }}
          >
            {metrics.map((metric) => (
              <div key={metric.label} style={{ border: '1px solid #F2F4F7', borderRadius: 14, padding: '12px 14px' }}>
                <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">{metric.label}</Text>
                <Text className="text-2xl font-semibold text-[#101828] mt-1">{metric.value}</Text>
                {metric.helper ? <Text className="text-xs text-[#667085] mt-1">{metric.helper}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section className="mb-6" style={{ ...cardStyle, background: '#F8F9FC' }}>
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
          Job results
        </Heading>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#98A2B3', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              <th style={{ paddingBottom: 6, paddingRight: 8, whiteSpace: 'nowrap' }}>Job</th>
              <th style={{ paddingBottom: 6, paddingRight: 8, whiteSpace: 'nowrap' }}>Window</th>
              <th style={{ paddingBottom: 6, paddingRight: 8, whiteSpace: 'nowrap' }}>Attempted</th>
              <th style={{ paddingBottom: 6, paddingRight: 8, whiteSpace: 'nowrap' }}>Sent</th>
              <th style={{ paddingBottom: 6, paddingRight: 8, whiteSpace: 'nowrap' }}>Failed</th>
              <th style={{ paddingBottom: 6, paddingRight: 8, whiteSpace: 'nowrap' }}>Skipped</th>
              <th style={{ paddingBottom: 6, paddingRight: 8, whiteSpace: 'nowrap' }}>Duration</th>
              <th style={{ paddingBottom: 6, paddingRight: 8, whiteSpace: 'nowrap' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {jobResults.map((job) => (
              <tr key={job.jobName} style={{ borderTop: '1px solid #EAECF0', fontSize: 14, color: '#101828' }}>
                <td style={{ padding: '12px 8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontWeight: 600 }}>{job.jobName}</span>
                    {job.severity ? (
                      <span
                        style={{
                          ...pillStyle,
                          borderColor: jobSeverityBadge[job.severity].border,
                          background: jobSeverityBadge[job.severity].bg,
                          color: jobSeverityBadge[job.severity].color,
                          fontSize: 11,
                          alignSelf: 'flex-start',
                        }}
                      >
                        {jobSeverityBadge[job.severity].label}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td style={{ padding: '12px 8px', color: '#475467' }}>{job.window}</td>
                <td style={{ padding: '12px 8px' }}>{job.attempted}</td>
                <td style={{ padding: '12px 8px', color: '#027A48', fontWeight: 600 }}>{job.sent}</td>
                <td style={{ padding: '12px 8px', color: job.failed ? '#B42318' : '#101828' }}>{job.failed}</td>
                <td style={{ padding: '12px 8px' }}>{job.skipped ?? '—'}</td>
                <td style={{ padding: '12px 8px' }}>{job.duration ?? '—'}</td>
                <td style={{ padding: '12px 8px', color: '#475467' }}>{job.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {incidents?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Incidents & warnings
          </Heading>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.title} style={{ border: '1px solid #E4E7EC', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text className="text-base font-semibold text-[#101828]">{incident.title}</Text>
                  {incident.severity ? (
                    <span
                      style={{
                        ...pillStyle,
                        borderColor: incidentSeverityBadge[incident.severity].border,
                        background: incidentSeverityBadge[incident.severity].bg,
                        color: incidentSeverityBadge[incident.severity].color,
                      }}
                    >
                      {incident.severity} priority
                    </span>
                  ) : null}
                </div>
                <Text className="mt-1 text-sm text-[#475467]">{incident.detail}</Text>
                {incident.owner ? <Text className="mt-1 text-xs text-[#98A2B3]">Owner: {incident.owner}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {backlog?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Queue health
          </Heading>
          <div className="space-y-2">
            {backlog.map((item) => (
              <Row key={item.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '10px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '40%' }}>
                  <Text className="text-sm text-[#98A2B3] uppercase tracking-[0.2em]">{item.label}</Text>
                </Column>
                <Column style={{ width: '60%' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Text className="text-base font-semibold text-[#101828]">{item.count}</Text>
                    {item.trend ? <span style={{ color: '#98A2B3', fontSize: 14 }}>{trendIcon[item.trend]}</span> : null}
                  </div>
                  {item.helper ? <Text className="text-xs text-[#98A2B3]">{item.helper}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {followUpLinks?.length || operatorNotes ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Follow-up
          </Heading>
          {followUpLinks?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {followUpLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
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
                    {link.label}
                    {link.description ? (
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#6941C6' }}>{link.description}</span>
                    ) : null}
                  </span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          ) : null}
          {operatorNotes ? <Text className="mt-3 text-sm text-[#475467]">{operatorNotes}</Text> : null}
        </Section>
      ) : null}

      {nextRunWindow ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-1">
            Next scheduled run
          </Heading>
          <Text className="text-sm text-[#475467]">{nextRunWindow}</Text>
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Run {runId} · Generated automatically after the {cronName} cron finished processing reminders and reviews.
      </Text>
    </EmailLayout>
  );
}

export default SystemCronSummaryEmail;
