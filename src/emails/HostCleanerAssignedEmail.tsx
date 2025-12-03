import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export type CleanerStatus = 'confirmed' | 'pending' | 'en-route' | 'completed';

export interface CleanerAssignmentItem {
  name: string;
  company?: string;
  arrivalWindow: string;
  status: CleanerStatus;
  contact?: string;
  note?: string;
}

export interface TurnoverPrepItem {
  label: string;
  detail?: string;
  status?: 'ready' | 'in-progress' | 'needs-action';
}

export interface HostCleanerAssignedEmailProps {
  hostName?: string;
  propertyName: string;
  turnoverDate: string;
  guestDeparture?: string;
  assignments: CleanerAssignmentItem[];
  prepItems?: TurnoverPrepItem[];
  escalationNote?: string;
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

const assignmentStatusColors: Record<CleanerStatus, string> = {
  confirmed: '#027A48',
  pending: '#B54708',
  'en-route': '#7F56D9',
  completed: '#12B76A',
};

export function HostCleanerAssignedEmail(props: HostCleanerAssignedEmailProps) {
  const { hostName, propertyName, turnoverDate, guestDeparture, assignments, prepItems, escalationNote, attachments } = props;

  const preview = `Cleaners booked for ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Triggered when cleaner assignments lock for the turnover.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Cleaner assignment</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, turnovers set for ${propertyName}` : `Turnovers set for ${propertyName}`}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Here&apos;s who is handling the clean plus any prep tasks before the next arrival.
        </Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{turnoverDate}</span>
          {guestDeparture ? <span style={chipStyle}>Guest checkout {guestDeparture}</span> : null}
          <span style={chipStyle}>{assignments.length} cleaner{assignments.length === 1 ? '' : 's'}</span>
        </div>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">Cleaner roster</Heading>
        <div className="mt-3 space-y-2">
          {assignments.map((assignment) => (
            <Row key={assignment.name} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
              <Column style={{ width: '60%' }}>
                <Text className="text-base font-semibold text-[#101828]">{assignment.name}</Text>
                <Text className="text-sm text-[#475467]">{assignment.company ?? 'Independent contractor'}</Text>
                {assignment.contact ? <Text className="text-sm text-[#475467]">{assignment.contact}</Text> : null}
                {assignment.note ? <Text className="text-sm text-[#475467]">{assignment.note}</Text> : null}
              </Column>
              <Column style={{ width: '40%', textAlign: 'right' }}>
                <Text className="text-sm font-semibold" style={{ color: assignmentStatusColors[assignment.status] }}>
                  {assignment.status.replace('-', ' ')}
                </Text>
                <Text className="text-xs text-[#98A2B3]">{assignment.arrivalWindow}</Text>
              </Column>
            </Row>
          ))}
        </div>
      </Section>

      {prepItems?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Prep checklist</Heading>
          <div className="mt-3 space-y-2">
            {prepItems.map((item) => (
              <Row key={item.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                  {item.detail ? <Text className="text-sm text-[#475467]">{item.detail}</Text> : null}
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  {item.status ? (
                    <Text className="text-sm font-semibold" style={{ color: item.status === 'ready' ? '#027A48' : item.status === 'in-progress' ? '#7F56D9' : '#B54708' }}>
                      {item.status.replace('-', ' ')}
                    </Text>
                  ) : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {attachments?.length || escalationNote ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Reference</Heading>
          {escalationNote ? <Text className="text-sm text-[#475467]">{escalationNote}</Text> : null}
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
      <Text className="text-xs text-[#98A2B3]">Cleaner assignments sync from the turnover board. Reply if you need to swap vendors.</Text>
    </EmailLayout>
  );
}

export default HostCleanerAssignedEmail;
