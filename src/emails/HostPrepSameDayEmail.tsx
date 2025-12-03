import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface ArrivalTaskItem {
  time: string;
  title: string;
  owner: string;
  status: 'pending' | 'in-progress' | 'complete';
  detail?: string;
}

export interface ArrivalChecklistItem {
  label: string;
  status: 'done' | 'pending' | 'attention';
  note?: string;
}

export interface AlertItem {
  label: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface QuickFactItem {
  label: string;
  value: string;
  helper?: string;
}

export interface ContactRoleItem {
  role: string;
  person: string;
  contact: string;
  note?: string;
}

export interface HostPrepSameDayEmailProps {
  hostName?: string;
  propertyName: string;
  propertyLocation?: string;
  guestName: string;
  arrivalWindow: string;
  etaLabel: string;
  headcount?: string;
  parkingNote?: string;
  weatherNote?: string;
  arrivalTasks: ArrivalTaskItem[];
  checklist: ArrivalChecklistItem[];
  alerts?: AlertItem[];
  contacts?: ContactRoleItem[];
  quickFacts?: QuickFactItem[];
  attachments?: { label: string; href: string; description?: string }[];
  escalationNote?: string;
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

const taskStatusMap: Record<ArrivalTaskItem['status'], { bg: string; color: string; label: string }> = {
  pending: { bg: '#F4EBFF', color: '#7F56D9', label: 'Queued' },
  'in-progress': { bg: '#FEF4E6', color: '#B54708', label: 'In progress' },
  complete: { bg: '#ECFDF3', color: '#027A48', label: 'Complete' },
};

const checklistStatusMap: Record<ArrivalChecklistItem['status'], { color: string; label: string }> = {
  done: { color: '#027A48', label: 'Done' },
  pending: { color: '#B54708', label: 'Pending' },
  attention: { color: '#B42318', label: 'Needs attention' },
};

const alertSeverityMap: Record<AlertItem['severity'], { color: string; bg: string; label: string }> = {
  info: { color: '#3538CD', bg: '#EEF4FF', label: 'Info' },
  warning: { color: '#B54708', bg: '#FEF4E6', label: 'Warning' },
  critical: { color: '#B42318', bg: '#FEF3F2', label: 'Critical' },
};

export function HostPrepSameDayEmail(props: HostPrepSameDayEmailProps) {
  const {
    hostName,
    propertyName,
    propertyLocation,
    guestName,
    arrivalWindow,
    etaLabel,
    headcount,
    parkingNote,
    weatherNote,
    arrivalTasks,
    checklist,
    alerts,
    contacts,
    quickFacts,
    attachments,
    escalationNote,
  } = props;

  const preview = `${guestName} arrives today at ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Need backup? Reply or ping the #host-support room.">
      <Section>
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Same-day host prep</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, t` : 'T'}oday&rsquo;s arrivals for {guestName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Doors open soon—use the timeline below to confirm everything is guest-ready before the first hello.
        </Text>
        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{arrivalWindow}</span>
          <span style={chipStyle}>{etaLabel}</span>
          {headcount ? <span style={chipStyle}>{headcount}</span> : null}
          {parkingNote ? <span style={chipStyle}>{parkingNote}</span> : null}
          {weatherNote ? <span style={{ ...chipStyle, borderColor: '#7F56D9', color: '#7F56D9' }}>{weatherNote}</span> : null}
        </div>
      </Section>

      {quickFacts?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828]">Property quick facts</Heading>
          <Text className="mt-2 text-sm text-[#475467]">
            {propertyName}
            {propertyLocation ? ` · ${propertyLocation}` : ''}
          </Text>
          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
            }}
          >
            {quickFacts.map((fact) => (
              <div key={fact.label} style={{ border: '1px solid #F2F4F7', borderRadius: 14, padding: '12px 14px' }}>
                <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">{fact.label}</Text>
                <Text className="text-xl font-semibold text-[#101828] mt-1">{fact.value}</Text>
                {fact.helper ? <Text className="text-xs text-[#667085] mt-1">{fact.helper}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {arrivalTasks.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">Today&rsquo;s timeline</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {arrivalTasks.map((task) => (
              <div key={task.title + task.time} style={{ borderLeft: '3px solid #E4E7EC', paddingLeft: 16 }}>
                <Text className="text-xs text-[#98A2B3]">{task.time}</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Text className="text-base font-semibold text-[#101828]">{task.title}</Text>
                  <span
                    style={{
                      ...chipStyle,
                      borderColor: taskStatusMap[task.status].bg,
                      background: taskStatusMap[task.status].bg,
                      color: taskStatusMap[task.status].color,
                      fontSize: 11,
                    }}
                  >
                    {taskStatusMap[task.status].label}
                  </span>
                </div>
                <Text className="text-sm text-[#475467] mt-1">Owner: {task.owner}</Text>
                {task.detail ? <Text className="text-sm text-[#475467] mt-1">{task.detail}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {checklist.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">Final checklist</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {checklist.map((item) => (
              <Row key={item.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '10px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '50%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                </Column>
                <Column style={{ width: '50%' }}>
                  <Text className="text-sm font-semibold" style={{ color: checklistStatusMap[item.status].color }}>
                    {checklistStatusMap[item.status].label}
                  </Text>
                  {item.note ? <Text className="text-sm text-[#475467]">{item.note}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {alerts?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">Alerts</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((alert) => (
              <div
                key={alert.label}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${alertSeverityMap[alert.severity].bg}`,
                  background: alertSeverityMap[alert.severity].bg,
                  padding: '12px 16px',
                }}
              >
                <Text className="text-sm font-semibold" style={{ color: alertSeverityMap[alert.severity].color }}>
                  {alertSeverityMap[alert.severity].label}
                </Text>
                <Text className="text-base font-semibold text-[#101828]">{alert.label}</Text>
                <Text className="text-sm text-[#475467]">{alert.detail}</Text>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {contacts?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">Support roster</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {contacts.map((contact) => (
              <Row key={contact.role} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '40%' }}>
                  <Text className="text-sm uppercase tracking-[0.2em] text-[#98A2B3]">{contact.role}</Text>
                </Column>
                <Column style={{ width: '60%' }}>
                  <Text className="text-sm text-[#101828]">{contact.person} · {contact.contact}</Text>
                  {contact.note ? <Text className="text-xs text-[#475467]">{contact.note}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {attachments?.length || escalationNote ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">Reference links</Heading>
          {attachments?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {attachments.map((attachment) => (
                <a key={attachment.href} href={attachment.href} className="text-sm text-[#7F56D9]">
                  {attachment.label}
                  {attachment.description ? <span style={{ display: 'block', color: '#475467' }}>{attachment.description}</span> : null}
                </a>
              ))}
            </div>
          ) : null}
          {escalationNote ? <Text className="mt-3 text-sm text-[#475467]">{escalationNote}</Text> : null}
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Automated same-day host reminder · Generated morning-of to keep staffing and arrival intel aligned.
      </Text>
    </EmailLayout>
  );
}

export default HostPrepSameDayEmail;
