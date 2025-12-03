import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export type ChecklistStatus = 'done' | 'pending' | 'attention';
export type LockStatus = 'ready' | 'in-progress' | 'issue';

export interface LockStatusItem {
  label: string;
  status: LockStatus;
  note?: string;
}

export interface CodeScheduleItem {
  label: string;
  code: string;
  validWindow: string;
  channel?: string;
  note?: string;
}

export interface ChecklistItem {
  label: string;
  detail?: string;
  status: ChecklistStatus;
}

export interface FallbackItem {
  label: string;
  detail: string;
  accessInfo?: string;
}

export interface ContactItem {
  label: string;
  value: string;
  note?: string;
}

export interface HostDoorCodeReminderEmailProps {
  hostName?: string;
  propertyName: string;
  propertyLocation?: string;
  guestName: string;
  arrivalWindow: string;
  lockDevice: string;
  timezone?: string;
  generatedAt?: string;
  codeRotationTime?: string;
  lockStatuses: LockStatusItem[];
  codes: CodeScheduleItem[];
  checklist: ChecklistItem[];
  fallbacks?: FallbackItem[];
  contacts?: ContactItem[];
  incidentNotes?: string;
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

const lockStatusStyles: Record<LockStatus, { label: string; color: string; bg: string }> = {
  ready: { label: 'Ready', color: '#027A48', bg: '#ECFDF3' },
  'in-progress': { label: 'Syncing', color: '#B54708', bg: '#FEF4E6' },
  issue: { label: 'Attention', color: '#B42318', bg: '#FEF3F2' },
};

const checklistStatusStyles: Record<ChecklistStatus, { label: string; color: string }> = {
  done: { label: 'Done', color: '#027A48' },
  pending: { label: 'Pending', color: '#B54708' },
  attention: { label: 'Needs attention', color: '#B42318' },
};

export function HostDoorCodeReminderEmail(props: HostDoorCodeReminderEmailProps) {
  const {
    hostName,
    propertyName,
    propertyLocation,
    guestName,
    arrivalWindow,
    lockDevice,
    timezone,
    generatedAt,
    codeRotationTime,
    lockStatuses,
    codes,
    checklist,
    fallbacks,
    contacts,
    incidentNotes,
    attachments,
  } = props;

  const previewText = `${propertyName}: lock codes refreshing for ${guestName}`;

  return (
    <EmailLayout
      previewText={previewText}
      footerText="Bunks automates smart lock orchestration so you can focus on hospitality."
    >
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Lock automation</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, ` : ''}door code refresh for {guestName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Arrival is around the corner. Confirm the smart lock timeline, verify backups, and keep ops in the loop if
          anything drifts.
        </Text>
        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{arrivalWindow}</span>
          <span style={chipStyle}>{lockDevice}</span>
          {timezone ? <span style={chipStyle}>{timezone}</span> : null}
          {propertyLocation ? <span style={chipStyle}>{propertyLocation}</span> : null}
        </div>
        {generatedAt || codeRotationTime ? (
          <Text className="mt-2 text-xs text-[#98A2B3]">
            Generated {generatedAt ?? 'just now'} · Auto-rotation {codeRotationTime ?? 'on arrival day'}
          </Text>
        ) : null}
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">Lock status</Heading>
        <Text className="mt-2 text-sm text-[#475467]">
          Track hardware checks and integrations across each lock or keypad.
        </Text>
        <div className="mt-4 space-y-3">
          {lockStatuses.map((status) => (
            <div
              key={status.label}
              style={{
                border: '1px solid #F2F4F7',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <div>
                <Text className="text-sm font-semibold text-[#101828]">{status.label}</Text>
                {status.note ? <Text className="text-sm text-[#475467]">{status.note}</Text> : null}
              </div>
              <span
                style={{
                  ...chipStyle,
                  borderColor: lockStatusStyles[status.status].bg,
                  background: lockStatusStyles[status.status].bg,
                  color: lockStatusStyles[status.status].color,
                  fontSize: 11,
                }}
              >
                {lockStatusStyles[status.status].label}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h3" className="text-lg font-semibold text-[#101828]">Access codes & schedules</Heading>
        <div className="mt-3 space-y-3">
          {codes.map((code) => (
            <Row key={code.label} style={{ borderBottom: '1px solid #F2F4F7', paddingBottom: 10 }}>
              <Column style={{ width: '45%' }}>
                <Text className="text-sm font-semibold text-[#101828]">{code.label}</Text>
                <Text className="text-base text-[#101828]">{code.code}</Text>
                <Text className="text-xs text-[#98A2B3]">{code.validWindow}</Text>
              </Column>
              <Column style={{ width: '55%' }}>
                {code.channel ? (
                  <Text className="text-sm text-[#475467]">Channel: {code.channel}</Text>
                ) : null}
                {code.note ? <Text className="text-sm text-[#475467]">{code.note}</Text> : null}
              </Column>
            </Row>
          ))}
        </div>
      </Section>

      {checklist.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Action checklist</Heading>
          <div className="mt-3 space-y-2">
            {checklist.map((item) => (
              <Row key={item.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '10px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '50%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                </Column>
                <Column style={{ width: '50%' }}>
                  <Text className="text-sm font-semibold" style={{ color: checklistStatusStyles[item.status].color }}>
                    {checklistStatusStyles[item.status].label}
                  </Text>
                  {item.detail ? <Text className="text-sm text-[#475467]">{item.detail}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {fallbacks?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Fallback access</Heading>
          <div className="mt-3 space-y-2">
            {fallbacks.map((fallback) => (
              <div key={fallback.label} style={{ borderBottom: '1px solid #F2F4F7', paddingBottom: 10 }}>
                <Text className="text-base font-semibold text-[#101828]">{fallback.label}</Text>
                <Text className="text-sm text-[#475467]">{fallback.detail}</Text>
                {fallback.accessInfo ? <Text className="text-sm text-[#475467]">Access: {fallback.accessInfo}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {contacts?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">On-call contacts</Heading>
          <div className="mt-3 space-y-2">
            {contacts.map((contact) => (
              <Row key={contact.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '40%' }}>
                  <Text className="text-sm uppercase tracking-[0.2em] text-[#98A2B3]">{contact.label}</Text>
                </Column>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base text-[#101828]">{contact.value}</Text>
                  {contact.note ? <Text className="text-xs text-[#475467]">{contact.note}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {(attachments?.length ?? 0) > 0 || incidentNotes ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Reference links & notes</Heading>
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
          {incidentNotes ? <Text className="mt-3 text-sm text-[#475467]">{incidentNotes}</Text> : null}
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Automated reminder generated by Bunks lock orchestration · flag mismatches before the guest arrives.
      </Text>
    </EmailLayout>
  );
}

export default HostDoorCodeReminderEmail;
