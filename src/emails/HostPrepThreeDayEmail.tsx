import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface PrepTimelineItem {
  label: string;
  owner: string;
  window: string;
  status: 'scheduled' | 'in-progress' | 'complete';
  notes?: string;
}

export interface SupplyReminderItem {
  item: string;
  status?: 'stocked' | 'needs-restock' | 'ordered';
  note?: string;
}

export interface QuickFactItem {
  label: string;
  value: string;
  helper?: string;
}

export interface ContactChannel {
  label: string;
  value: string;
  note?: string;
}

export interface HostPrepThreeDayEmailProps {
  hostName?: string;
  propertyName: string;
  propertyLocation?: string;
  guestName: string;
  stayDates: string;
  arrivalWindow: string;
  nights: number;
  headcount: string;
  housekeepingWindow?: string;
  specialRequests?: string[];
  prepTimeline: PrepTimelineItem[];
  supplyReminders?: SupplyReminderItem[];
  quickFacts?: QuickFactItem[];
  contacts?: ContactChannel[];
  attachments?: { label: string; href: string; description?: string }[];
  escalationNote?: string;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 18,
  padding: '20px 22px',
  backgroundColor: '#FFFFFF',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  borderRadius: 999,
  border: '1px solid #E4E7EC',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
};

const statusChips: Record<PrepTimelineItem['status'], { bg: string; color: string; label: string }> = {
  scheduled: { bg: '#F4EBFF', color: '#7F56D9', label: 'Scheduled' },
  'in-progress': { bg: '#FEF4E6', color: '#B54708', label: 'In progress' },
  complete: { bg: '#ECFDF3', color: '#027A48', label: 'Complete' },
};

const supplyStatusMap: Record<NonNullable<SupplyReminderItem['status']>, { color: string; label: string }> = {
  stocked: { color: '#027A48', label: 'Stocked' },
  'needs-restock': { color: '#B54708', label: 'Needs restock' },
  ordered: { color: '#7F56D9', label: 'Ordered' },
};

export function HostPrepThreeDayEmail(props: HostPrepThreeDayEmailProps) {
  const {
    hostName,
    propertyName,
    propertyLocation,
    guestName,
    stayDates,
    arrivalWindow,
    nights,
    headcount,
    housekeepingWindow,
    specialRequests,
    prepTimeline,
    supplyReminders,
    quickFacts,
    contacts,
    attachments,
    escalationNote,
  } = props;

  const preview = `${propertyName} · arrivals in 3 days`;

  return (
    <EmailLayout previewText={preview} footerText="Questions? Reply back or ping the Bunks ops desk anytime.">
      <Section>
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">3-day host prep</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, h` : 'H'}ere&rsquo;s the plan for {guestName}&rsquo;s stay
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          We&rsquo;re three days out from arrival. Confirm the checklist below so the home is guest-ready and ops stay on track.
        </Text>
        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={badgeStyle}>Stay: {stayDates}</span>
          <span style={badgeStyle}>Arrival: {arrivalWindow}</span>
          <span style={badgeStyle}>Guests: {headcount}</span>
          <span style={badgeStyle}>{nights} nights</span>
          {housekeepingWindow ? <span style={badgeStyle}>Housekeeping: {housekeepingWindow}</span> : null}
        </div>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">
          Property snapshot
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
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
          {(quickFacts ?? []).map((fact) => (
            <div key={fact.label} style={{ border: '1px solid #F2F4F7', borderRadius: 14, padding: '12px 14px' }}>
              <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">{fact.label}</Text>
              <Text className="text-xl font-semibold text-[#101828] mt-1">{fact.value}</Text>
              {fact.helper ? <Text className="text-xs text-[#667085] mt-1">{fact.helper}</Text> : null}
            </div>
          ))}
        </div>
      </Section>

      {prepTimeline.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Prep timeline
          </Heading>
          <div className="space-y-3">
            {prepTimeline.map((item) => (
              <div key={item.label + item.owner} style={{ borderLeft: '3px solid #E4E7EC', paddingLeft: 16 }}>
                <Text className="text-xs text-[#98A2B3]">{item.window}</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                  <span
                    style={{
                      ...badgeStyle,
                      borderColor: statusChips[item.status].bg,
                      background: statusChips[item.status].bg,
                      color: statusChips[item.status].color,
                      fontSize: 11,
                    }}
                  >
                    {statusChips[item.status].label}
                  </span>
                </div>
                <Text className="text-sm text-[#475467] mt-1">Owner: {item.owner}</Text>
                {item.notes ? <Text className="text-sm text-[#475467] mt-1">{item.notes}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {specialRequests?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Special requests & notes
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467] space-y-2">
            {specialRequests.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {supplyReminders?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Supplies & resets
          </Heading>
          <div className="space-y-2">
            {supplyReminders.map((supply) => (
              <Row key={supply.item} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '40%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{supply.item}</Text>
                </Column>
                <Column style={{ width: '60%' }}>
                  {supply.status ? (
                    <Text className="text-sm font-semibold" style={{ color: supplyStatusMap[supply.status].color }}>
                      {supplyStatusMap[supply.status].label}
                    </Text>
                  ) : null}
                  {supply.note ? <Text className="text-sm text-[#475467]">{supply.note}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {contacts?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Quick contacts
          </Heading>
          <div className="space-y-2">
            {contacts.map((contact) => (
              <Row key={contact.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0', alignItems: 'baseline' }}>
                <Column style={{ width: '35%' }}>
                  <Text className="text-sm uppercase tracking-[0.2em] text-[#98A2B3]">{contact.label}</Text>
                </Column>
                <Column style={{ width: '65%' }}>
                  <Text className="text-sm text-[#101828]">{contact.value}</Text>
                  {contact.note ? <Text className="text-xs text-[#475467]">{contact.note}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {attachments?.length || escalationNote ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Reference links
          </Heading>
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
        Automated host prep reminder · Sent 3 days before arrival so staffing, supplies, and arrival intel stay on schedule.
      </Text>
    </EmailLayout>
  );
}

export default HostPrepThreeDayEmail;
