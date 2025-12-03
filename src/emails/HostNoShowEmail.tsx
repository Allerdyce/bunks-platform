import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface ChargeRetentionItem {
  label: string;
  amount: string;
  note?: string;
}

export interface HostNoShowTaskItem {
  label: string;
  detail?: string;
  owner?: string;
  status?: 'pending' | 'done' | 'in-progress';
}

export interface HostNoShowEmailProps {
  hostName?: string;
  propertyName: string;
  guestName: string;
  stayDates: string;
  declaredAt: string;
  detectionSource: string;
  retainedAmount?: string;
  retentionLines?: ChargeRetentionItem[];
  calendarStatus?: string;
  rebookWindow?: string;
  tasks?: HostNoShowTaskItem[];
  notes?: string;
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

export function HostNoShowEmail(props: HostNoShowEmailProps) {
  const { hostName, propertyName, guestName, stayDates, declaredAt, detectionSource, retainedAmount, retentionLines, calendarStatus, rebookWindow, tasks, notes } = props;

  const preview = `No-show recorded · ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Triggered when staff marks a booking as no-show.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">No-show</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, ` : ''}{guestName} never checked in
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          We declared a no-show on {declaredAt} after monitoring {detectionSource}. Use the summary below to confirm charges
          and reopen the calendar.
        </Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{stayDates}</span>
          <span style={chipStyle}>{detectionSource}</span>
          {calendarStatus ? <span style={chipStyle}>{calendarStatus}</span> : null}
          {rebookWindow ? <span style={chipStyle}>Rebook window {rebookWindow}</span> : null}
        </div>
      </Section>

      {retainedAmount || retentionLines?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828]">Charges retained</Heading>
          {retainedAmount ? (
            <Text className="mt-2 text-2xl font-semibold text-[#101828]">{retainedAmount}</Text>
          ) : null}
          {retentionLines?.length ? (
            <div className="mt-3 space-y-2">
              {retentionLines.map((line) => (
                <Row key={line.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                  <Column style={{ width: '60%' }}>
                    <Text className="text-base font-semibold text-[#101828]">{line.label}</Text>
                    {line.note ? <Text className="text-sm text-[#475467]">{line.note}</Text> : null}
                  </Column>
                  <Column style={{ width: '40%', textAlign: 'right' }}>
                    <Text className="text-base font-semibold text-[#101828]">{line.amount}</Text>
                  </Column>
                </Row>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      {tasks?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Next steps</Heading>
          <div className="mt-3 space-y-2">
            {tasks.map((task) => (
              <Row key={task.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{task.label}</Text>
                  {task.detail ? <Text className="text-sm text-[#475467]">{task.detail}</Text> : null}
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  {task.status ? (
                    <Text className="text-sm font-semibold" style={{ color: task.status === 'done' ? '#027A48' : task.status === 'in-progress' ? '#7F56D9' : '#B54708' }}>
                      {task.status.replace('-', ' ')}
                    </Text>
                  ) : null}
                  {task.owner ? <Text className="text-xs text-[#475467]">Owner · {task.owner}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {notes ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Notes</Heading>
          <Text className="text-sm text-[#475467]">{notes}</Text>
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">Appeal window stays open for 24h. Reply if you want to release additional nights.</Text>
    </EmailLayout>
  );
}

export default HostNoShowEmail;
