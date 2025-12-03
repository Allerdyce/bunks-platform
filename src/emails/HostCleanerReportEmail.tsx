import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export type CleanerIssueSeverity = 'info' | 'attention' | 'critical';

export interface CleanerIssue {
  area: string;
  detail: string;
  severity: CleanerIssueSeverity;
  photoUrl?: string;
  recommendation?: string;
}

export interface SupplyLevelItem {
  item: string;
  status: 'stocked' | 'low' | 'critical';
  note?: string;
}

export interface CleanerFollowUpItem {
  label: string;
  owner?: string;
  due?: string;
  status?: 'pending' | 'in-progress' | 'done';
  note?: string;
}

export interface HostCleanerReportEmailProps {
  hostName?: string;
  propertyName: string;
  cleanerName: string;
  turnoverDate: string;
  reportLoggedAt: string;
  summary: string;
  arrivalWindow?: string;
  nextGuest?: string;
  issues: CleanerIssue[];
  supplyLevels?: SupplyLevelItem[];
  followUps?: CleanerFollowUpItem[];
  attachments?: { label: string; href: string; description?: string }[];
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 18,
  padding: '20px 22px',
  backgroundColor: '#FFFFFF',
};

const chipStyle: React.CSSProperties = {
  borderRadius: 999,
  border: '1px solid #D0D5DD',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
};

const severityStyles: Record<CleanerIssueSeverity, { label: string; color: string; bg: string }> = {
  info: { label: 'Info', color: '#3538CD', bg: '#EEF4FF' },
  attention: { label: 'Needs attention', color: '#B54708', bg: '#FEF4E6' },
  critical: { label: 'Critical', color: '#B42318', bg: '#FEF3F2' },
};

const supplyStatusStyles: Record<SupplyLevelItem['status'], { label: string; color: string }> = {
  stocked: { label: 'Stocked', color: '#027A48' },
  low: { label: 'Low', color: '#B54708' },
  critical: { label: 'Critical', color: '#B42318' },
};

export function HostCleanerReportEmail(props: HostCleanerReportEmailProps) {
  const {
    hostName,
    propertyName,
    cleanerName,
    turnoverDate,
    reportLoggedAt,
    summary,
    arrivalWindow,
    nextGuest,
    issues,
    supplyLevels,
    followUps,
    attachments,
  } = props;

  const preview = `Cleaner report logged for ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Reply to loop cleaners + ops on the same thread.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Cleaner report</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, here&rsquo;s what we found after turnover` : 'Here&rsquo;s what we found after turnover'}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">{summary}</Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{turnoverDate}</span>
          <span style={chipStyle}>Cleaner · {cleanerName}</span>
          {arrivalWindow ? <span style={chipStyle}>Next arrival {arrivalWindow}</span> : null}
          {nextGuest ? <span style={chipStyle}>{nextGuest}</span> : null}
          <span style={chipStyle}>{reportLoggedAt}</span>
        </div>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">Issues & observations</Heading>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {issues.map((issue) => (
            <div
              key={issue.area}
              style={{
                borderRadius: 14,
                border: `1px solid ${severityStyles[issue.severity].bg}`,
                background: severityStyles[issue.severity].bg,
                padding: '14px 16px',
              }}
            >
              <Text className="text-sm font-semibold" style={{ color: severityStyles[issue.severity].color }}>
                {severityStyles[issue.severity].label}
              </Text>
              <Text className="text-base font-semibold text-[#101828]">{issue.area}</Text>
              <Text className="text-sm text-[#475467]">{issue.detail}</Text>
              {issue.recommendation ? <Text className="text-sm text-[#475467]">{issue.recommendation}</Text> : null}
              {issue.photoUrl ? (
                <a href={issue.photoUrl} className="text-sm text-[#7F56D9]">
                  View photo
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      {supplyLevels?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Supply levels</Heading>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {supplyLevels.map((supply) => (
              <Row key={supply.item} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '55%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{supply.item}</Text>
                  {supply.note ? <Text className="text-sm text-[#475467]">{supply.note}</Text> : null}
                </Column>
                <Column style={{ width: '45%', textAlign: 'right' }}>
                  <Text className="text-sm font-semibold" style={{ color: supplyStatusStyles[supply.status].color }}>
                    {supplyStatusStyles[supply.status].label}
                  </Text>
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {followUps?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Follow-ups</Heading>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {followUps.map((item) => (
              <Row key={item.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                  {item.note ? <Text className="text-sm text-[#475467]">{item.note}</Text> : null}
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  {item.status ? (
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: item.status === 'done' ? '#027A48' : item.status === 'in-progress' ? '#7F56D9' : '#B54708' }}
                    >
                      {item.status.replace('-', ' ')}
                    </Text>
                  ) : null}
                  {item.owner ? <Text className="text-xs text-[#475467]">Owner · {item.owner}</Text> : null}
                  {item.due ? <Text className="text-xs text-[#98A2B3]">Due {item.due}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {attachments?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Photos & links</Heading>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attachments.map((attachment) => (
              <a key={attachment.href} href={attachment.href} className="text-sm text-[#7F56D9]">
                {attachment.label}
                {attachment.description ? (
                  <span style={{ display: 'block', color: '#475467' }}>{attachment.description}</span>
                ) : null}
              </a>
            ))}
          </div>
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">Filed instantly from the cleaner app once turnover photos upload.</Text>
    </EmailLayout>
  );
}

export default HostCleanerReportEmail;
