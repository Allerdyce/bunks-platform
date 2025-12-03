import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export type TaskStatus = 'pending' | 'ready' | 'complete';

export interface AddOnTaskItem {
  label: string;
  owner?: string;
  due?: string;
  status: TaskStatus;
  note?: string;
}

export interface SupplyItem {
  label: string;
  status: 'stocked' | 'needs-order' | 'in-transit';
  note?: string;
}

export interface ContactItem {
  label: string;
  value: string;
  note?: string;
}

export interface HostAddOnSoldEmailProps {
  hostName?: string;
  propertyName: string;
  guestName: string;
  stayDates: string;
  addOnName: string;
  addOnWindow: string;
  providerName?: string;
  providerContact?: string;
  guestPrice: string;
  hostShare: string;
  bunksFee?: string;
  payoutDate?: string;
  tasks?: AddOnTaskItem[];
  supplies?: SupplyItem[];
  notes?: string[];
  contacts?: ContactItem[];
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

const taskStatusMap: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#B54708' },
  ready: { label: 'Ready', color: '#027A48' },
  complete: { label: 'Complete', color: '#027A48' },
};

const supplyStatusMap: Record<SupplyItem['status'], { label: string; color: string }> = {
  stocked: { label: 'Stocked', color: '#027A48' },
  'needs-order': { label: 'Needs order', color: '#B42318' },
  'in-transit': { label: 'On the way', color: '#7F56D9' },
};

export function HostAddOnSoldEmail(props: HostAddOnSoldEmailProps) {
  const {
    hostName,
    propertyName,
    guestName,
    stayDates,
    addOnName,
    addOnWindow,
    providerName,
    providerContact,
    guestPrice,
    hostShare,
    bunksFee,
    payoutDate,
    tasks,
    supplies,
    notes,
    contacts,
    attachments,
  } = props;

  const preview = `${addOnName} added for ${guestName}`;

  return (
    <EmailLayout previewText={preview} footerText="Questions? Reply to loop concierge + ops.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Add-on sold</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, ` : ''}{guestName} booked {addOnName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          We locked this add-on into the stay at {propertyName}. Use the prep list below to keep vendors coordinated.
        </Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{stayDates}</span>
          <span style={chipStyle}>{addOnWindow}</span>
          {providerName ? <span style={chipStyle}>{providerName}</span> : null}
        </div>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">Add-on details</Heading>
        <Row style={{ marginTop: 16 }}>
          <Column style={{ width: '50%' }}>
            <Text className="text-sm font-semibold text-[#7F56D9]">Service window</Text>
            <Text className="text-base text-[#101828]">{addOnWindow}</Text>
          </Column>
          <Column style={{ width: '50%' }}>
            <Text className="text-sm font-semibold text-[#7F56D9]">Vendor / owner</Text>
            <Text className="text-base text-[#101828]">{providerName ?? 'Bunks concierge'}</Text>
            {providerContact ? <Text className="text-sm text-[#475467]">{providerContact}</Text> : null}
          </Column>
        </Row>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h3" className="text-lg font-semibold text-[#101828]">Revenue snapshot</Heading>
        <Row style={{ marginTop: 16 }}>
          <Column style={{ width: '33%' }}>
            <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">Guest price</Text>
            <Text className="text-2xl font-semibold text-[#101828]">{guestPrice}</Text>
          </Column>
          <Column style={{ width: '33%' }}>
            <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">Host share</Text>
            <Text className="text-2xl font-semibold text-[#101828]">{hostShare}</Text>
          </Column>
          <Column style={{ width: '33%' }}>
            <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">Bunks fee</Text>
            <Text className="text-2xl font-semibold text-[#101828]">{bunksFee ?? 'Included'}</Text>
            {payoutDate ? <Text className="text-xs text-[#475467]">Payout {payoutDate}</Text> : null}
          </Column>
        </Row>
      </Section>

      {tasks?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Fulfillment tasks</Heading>
          <div className="mt-3 space-y-2">
            {tasks.map((task) => (
              <Row key={task.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '10px 0' }}>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{task.label}</Text>
                  {task.note ? <Text className="text-sm text-[#475467]">{task.note}</Text> : null}
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  <Text className="text-sm font-semibold" style={{ color: taskStatusMap[task.status].color }}>
                    {taskStatusMap[task.status].label}
                  </Text>
                  {task.owner ? <Text className="text-xs text-[#475467]">Owner · {task.owner}</Text> : null}
                  {task.due ? <Text className="text-xs text-[#98A2B3]">Due {task.due}</Text> : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {supplies?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Supplies & staging</Heading>
          <div className="mt-3 space-y-2">
            {supplies.map((supply) => (
              <Row key={supply.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{supply.label}</Text>
                  {supply.note ? <Text className="text-sm text-[#475467]">{supply.note}</Text> : null}
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  <Text className="text-sm font-semibold" style={{ color: supplyStatusMap[supply.status].color }}>
                    {supplyStatusMap[supply.status].label}
                  </Text>
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {notes?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Concierge notes</Heading>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#475467]">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {contacts?.length || attachments?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Quick links & contacts</Heading>
          {contacts?.length ? (
            <div className="mt-3 space-y-2">
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
          {attachments?.length ? (
            <div className="mt-4 flex flex-col gap-2">
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
      <Text className="text-xs text-[#98A2B3]">
        Logged automatically when a guest purchases an add-on. Reply with any changes and we&apos;ll update the work orders.
      </Text>
    </EmailLayout>
  );
}

export default HostAddOnSoldEmail;
