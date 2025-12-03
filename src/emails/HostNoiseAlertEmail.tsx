import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export type NoiseActionSeverity = 'info' | 'warning' | 'critical';

export interface NoiseActionItem {
  label: string;
  detail: string;
  severity: NoiseActionSeverity;
}

export interface NoiseTimelineItem {
  time: string;
  label: string;
  status?: 'sent' | 'pending' | 'complete';
  detail?: string;
}

export interface NoiseContactItem {
  label: string;
  value: string;
  note?: string;
}

export interface HostNoiseAlertEmailProps {
  hostName?: string;
  propertyName: string;
  alertSource: string;
  detectedAt: string;
  quietHours: string;
  decibelPeak: string;
  threshold: string;
  location: string;
  currentStatus: string;
  guestThreadUrl?: string;
  actions?: NoiseActionItem[];
  timeline?: NoiseTimelineItem[];
  contacts?: NoiseContactItem[];
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

const severityStyles: Record<NoiseActionSeverity, { color: string; bg: string; label: string }> = {
  info: { color: '#3538CD', bg: '#EEF4FF', label: 'Info' },
  warning: { color: '#B54708', bg: '#FEF4E6', label: 'Warning' },
  critical: { color: '#B42318', bg: '#FEF3F2', label: 'Critical' },
};

export function HostNoiseAlertEmail(props: HostNoiseAlertEmailProps) {
  const {
    hostName,
    propertyName,
    alertSource,
    detectedAt,
    quietHours,
    decibelPeak,
    threshold,
    location,
    currentStatus,
    guestThreadUrl,
    actions,
    timeline,
    contacts,
    notes,
  } = props;

  const preview = `Noise alert at ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Generated from Minut / Noiseaware events.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Noise alert</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, noise spiked at ${propertyName}` : `Noise spiked at ${propertyName}`}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          {alertSource} detected readings above limit at the {location}. Quiet hours are {quietHours}. Use the playbook
          below to keep neighbors happy.
        </Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{detectedAt}</span>
          <span style={chipStyle}>{decibelPeak}</span>
          <span style={chipStyle}>Threshold {threshold}</span>
          <span style={chipStyle}>{currentStatus}</span>
        </div>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">Current state</Heading>
        <Text className="mt-2 text-sm text-[#475467]">
          Quiet hours: {quietHours}. Alert source: {alertSource}. Location: {location}.
        </Text>
        {guestThreadUrl ? (
          <a href={guestThreadUrl} className="mt-3 inline-block text-sm font-semibold text-[#7F56D9]">
            View guest SMS / email thread
          </a>
        ) : null}
      </Section>

      {actions?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Next actions</Heading>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {actions.map((action) => (
              <div
                key={action.label}
                style={{
                  borderRadius: 14,
                  border: `1px solid ${severityStyles[action.severity].bg}`,
                  background: severityStyles[action.severity].bg,
                  padding: '12px 14px',
                }}
              >
                <Text className="text-sm font-semibold" style={{ color: severityStyles[action.severity].color }}>
                  {severityStyles[action.severity].label}
                </Text>
                <Text className="text-base font-semibold text-[#101828]">{action.label}</Text>
                <Text className="text-sm text-[#475467]">{action.detail}</Text>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {timeline?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Timeline</Heading>
          <div className="mt-3 space-y-2">
            {timeline.map((event, index) => (
              <Row key={`${event.label}-${index}`} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '30%' }}>
                  <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">{event.time}</Text>
                </Column>
                <Column style={{ width: '70%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{event.label}</Text>
                  {event.detail ? <Text className="text-sm text-[#475467]">{event.detail}</Text> : null}
                  {event.status ? (
                    <Text className="text-xs text-[#667085]" style={{ textTransform: 'capitalize' }}>
                      {event.status}
                    </Text>
                  ) : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {contacts?.length || notes ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Escalation contacts</Heading>
          {contacts?.length ? (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contacts.map((contact) => (
                <Row key={contact.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                  <Column style={{ width: '40%' }}>
                    <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">{contact.label}</Text>
                  </Column>
                  <Column style={{ width: '60%' }}>
                    <Text className="text-sm text-[#101828]">{contact.value}</Text>
                    {contact.note ? <Text className="text-xs text-[#475467]">{contact.note}</Text> : null}
                  </Column>
                </Row>
              ))}
            </div>
          ) : null}
          {notes ? <Text className="mt-3 text-sm text-[#475467]">{notes}</Text> : null}
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">Resolve within 10 minutes to avoid escalation to neighbors or community security.</Text>
    </EmailLayout>
  );
}

export default HostNoiseAlertEmail;
