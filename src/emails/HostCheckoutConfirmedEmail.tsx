import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export type InspectionStatus = 'clear' | 'issue' | 'monitor';

export interface CheckoutMetricItem {
  label: string;
  value: string;
  helper?: string;
}

export interface InspectionItem {
  label: string;
  status: InspectionStatus;
  detail?: string;
}

export interface CheckoutTaskItem {
  label: string;
  owner?: string;
  status: 'pending' | 'scheduled' | 'done';
  note?: string;
}

export interface HostCheckoutConfirmedEmailProps {
  hostName?: string;
  propertyName: string;
  checkoutTime: string;
  confirmationSource: string;
  cleanerStatus: string;
  lockStatus?: string;
  nextArrival?: string;
  metrics?: CheckoutMetricItem[];
  inspection?: InspectionItem[];
  tasks?: CheckoutTaskItem[];
  attachments?: { label: string; href: string; description?: string }[];
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

const inspectionColors: Record<InspectionStatus, { label: string; color: string }> = {
  clear: { label: 'Clear', color: '#027A48' },
  issue: { label: 'Issue', color: '#B42318' },
  monitor: { label: 'Monitor', color: '#B54708' },
};

export function HostCheckoutConfirmedEmail(props: HostCheckoutConfirmedEmailProps) {
  const {
    hostName,
    propertyName,
    checkoutTime,
    confirmationSource,
    cleanerStatus,
    lockStatus,
    nextArrival,
    metrics,
    inspection,
    tasks,
    attachments,
    notes,
  } = props;

  const preview = `Checkout confirmed at ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Auto-confirmed once smart locks + cleaners report departure.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Checkout confirmed</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, ` : ''}{propertyName} is now vacant
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Checkout verified at {checkoutTime} via {confirmationSource}. Cleaners are {cleanerStatus}.
        </Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{checkoutTime}</span>
          <span style={chipStyle}>{confirmationSource}</span>
          {lockStatus ? <span style={chipStyle}>{lockStatus}</span> : null}
          {nextArrival ? <span style={chipStyle}>Next arrival {nextArrival}</span> : null}
        </div>
      </Section>

      {metrics?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828]">Turnover snapshot</Heading>
          <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            {metrics.map((metric) => (
              <div key={metric.label} style={{ border: '1px solid #F2F4F7', borderRadius: 14, padding: '12px 14px' }}>
                <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">{metric.label}</Text>
                <Text className="mt-1 text-xl font-semibold text-[#101828]">{metric.value}</Text>
                {metric.helper ? <Text className="text-xs text-[#667085]">{metric.helper}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {inspection?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Inspection highlights</Heading>
          <div className="mt-3 space-y-2">
            {inspection.map((item) => (
              <Row key={item.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                  {item.detail ? <Text className="text-sm text-[#475467]">{item.detail}</Text> : null}
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  <Text className="text-sm font-semibold" style={{ color: inspectionColors[item.status].color }}>
                    {inspectionColors[item.status].label}
                  </Text>
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {tasks?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Open tasks</Heading>
          <div className="mt-3 space-y-2">
            {tasks.map((task) => (
              <Row key={task.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{task.label}</Text>
                  {task.note ? <Text className="text-sm text-[#475467]">{task.note}</Text> : null}
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: task.status === 'done' ? '#027A48' : task.status === 'scheduled' ? '#7F56D9' : '#B54708' }}
                  >
                    {task.status}
                  </Text>
                  {task.owner ? <Text className="text-xs text-[#475467]">Owner · {task.owner}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {attachments?.length || notes ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Photos & notes</Heading>
          {notes ? <Text className="text-sm text-[#475467]">{notes}</Text> : null}
          {attachments?.length ? (
            <div className="mt-3 flex flex-col gap-2">
              {attachments.map((attachment) => (
                <a key={attachment.href} href={attachment.href} className="text-sm text-[#7F56D9]">
                  {attachment.label}
                  {attachment.description ? (
                    <span style={{ display: 'block', color: '#475467' }}>{attachment.description}</span>
                  ) : null}
                </a>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">This alert fires when smart locks relock + cleaners confirm via the turnover app.</Text>
    </EmailLayout>
  );
}

export default HostCheckoutConfirmedEmail;
