import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export type ChangeFlag = 'dates' | 'headcount' | 'pricing' | 'notes';

export interface HostBookingChangeItem {
  label: string;
  previous: string;
  updated: string;
  note?: string;
  flag?: ChangeFlag;
}

export interface HostBookingTaskItem {
  label: string;
  owner?: string;
  due?: string;
  status?: 'pending' | 'complete' | 'in-progress';
  note?: string;
}

export interface PayoutImpactItem {
  label: string;
  value: string;
  helper?: string;
}

export interface HostBookingModifiedEmailProps {
  hostName?: string;
  propertyName: string;
  guestName: string;
  bookingId: number | string;
  changeLoggedAt: string;
  summary: string;
  stayDatesBefore?: string;
  stayDatesAfter: string;
  calendarStatus?: string;
  payoutImpact?: PayoutImpactItem[];
  changeItems?: HostBookingChangeItem[];
  tasks?: HostBookingTaskItem[];
  followUpNotes?: string;
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

const flagColors: Record<ChangeFlag, string> = {
  dates: '#7F56D9',
  headcount: '#12B76A',
  pricing: '#B54708',
  notes: '#0BA5EC',
};

const flagLabels: Record<ChangeFlag, string> = {
  dates: 'Dates',
  headcount: 'Headcount',
  pricing: 'Pricing',
  notes: 'Notes',
};

export function HostBookingModifiedEmail(props: HostBookingModifiedEmailProps) {
  const {
    hostName,
    propertyName,
    guestName,
    bookingId,
    changeLoggedAt,
    summary,
    stayDatesBefore,
    stayDatesAfter,
    calendarStatus,
    payoutImpact,
    changeItems,
    tasks,
    followUpNotes,
  } = props;

  const preview = `Booking ${bookingId} updated for ${guestName}`;

  return (
    <EmailLayout previewText={preview} footerText="Auto sent when a booking mutation completes.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Booking modified</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, ` : ''}{guestName}&rsquo;s stay changed
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">{summary}</Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {stayDatesBefore ? <span style={chipStyle}>Was {stayDatesBefore}</span> : null}
          <span style={chipStyle}>Now {stayDatesAfter}</span>
          <span style={chipStyle}>Booking #{bookingId}</span>
          <span style={chipStyle}>{changeLoggedAt}</span>
        </div>
        <Text className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#98A2B3]">{propertyName}</Text>
      </Section>

      {calendarStatus ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828]">Calendar status</Heading>
          <Text className="mt-2 text-sm text-[#475467]">{calendarStatus}</Text>
        </Section>
      ) : null}

      {payoutImpact?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Payout impact</Heading>
          <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            {payoutImpact.map((impact) => (
              <div key={impact.label} style={{ border: '1px solid #F2F4F7', borderRadius: 14, padding: '12px 14px' }}>
                <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">{impact.label}</Text>
                <Text className="mt-1 text-xl font-semibold text-[#101828]">{impact.value}</Text>
                {impact.helper ? <Text className="text-xs text-[#667085]">{impact.helper}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {changeItems?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">What changed</Heading>
          <div className="mt-3 space-y-3">
            {changeItems.map((item) => (
              <div key={item.label} style={{ borderBottom: '1px solid #F2F4F7', paddingBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                  {item.flag ? (
                    <span
                      style={{
                        ...chipStyle,
                        borderColor: flagColors[item.flag],
                        color: flagColors[item.flag],
                        fontSize: 11,
                      }}
                    >
                      {flagLabels[item.flag]}
                    </span>
                  ) : null}
                </div>
                <Text className="text-sm text-[#475467]">From: {item.previous}</Text>
                <Text className="text-sm text-[#101828]">To: {item.updated}</Text>
                {item.note ? <Text className="text-sm text-[#475467]">{item.note}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {tasks?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Action items</Heading>
          <div className="mt-3 space-y-2">
            {tasks.map((task) => (
              <Row key={task.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '55%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{task.label}</Text>
                  {task.note ? <Text className="text-sm text-[#475467]">{task.note}</Text> : null}
                </Column>
                <Column style={{ width: '45%', textAlign: 'right' }}>
                  {task.status ? (
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: task.status === 'complete' ? '#027A48' : task.status === 'in-progress' ? '#7F56D9' : '#B54708' }}
                    >
                      {task.status.replace('-', ' ')}
                    </Text>
                  ) : null}
                  {task.owner ? <Text className="text-xs text-[#475467]">Owner · {task.owner}</Text> : null}
                  {task.due ? <Text className="text-xs text-[#98A2B3]">Due {task.due}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {followUpNotes ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Follow-up</Heading>
          <Text className="text-sm text-[#475467]">{followUpNotes}</Text>
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">Triggered automatically when a booking mutation completes in Bunks Admin.</Text>
    </EmailLayout>
  );
}

export default HostBookingModifiedEmail;
