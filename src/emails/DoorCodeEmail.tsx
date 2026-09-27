import * as React from 'react';
import { Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface DoorCodeInstruction {
  title: string;
  detail: string;
}

export interface DoorCodeEmailProps {
  guestName: string;
  propertyName: string;
  arrivalDate: string;
  arrivalWindow: string;
  doorCode: string;
  codeValidWindow?: string;
  codeLabel?: string;
  parkingInfo: DoorCodeInstruction[];
  entrySteps: DoorCodeInstruction[];
  wifi?: { network: string; password: string };
  backupPlan?: DoorCodeInstruction[];
  securityNotes?: string[];
  support: {
    email: string;
    phone?: string;
    concierge?: string;
    note?: string;
  };
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 18,
  padding: '20px 24px',
  background: '#FFFFFF',
};

export function DoorCodeEmail(props: DoorCodeEmailProps) {
  const {
    guestName,
    propertyName,
    arrivalDate,
    arrivalWindow,
    doorCode,
    codeValidWindow,
    codeLabel,
    parkingInfo,
    entrySteps,
    wifi,
    backupPlan,
    securityNotes,
    support,
  } = props;

  return (
    <EmailLayout previewText={`Secure door code for ${propertyName}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Your arrival</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Hey {guestName}, here&apos;s your code for {propertyName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Screenshot this email before you travel in case you lose signal on the way.
        </Text>
      </Section>

      <Section className="mb-6 rounded-3xl border border-[#D0D5DD] bg-[#101828] p-5 text-white">
        <Text className="text-xs uppercase tracking-[0.35em] text-[#E4E7EC]">{codeLabel ?? 'Entry code'}</Text>
        <Heading className="mt-2 text-3xl font-semibold">{doorCode}</Heading>
        {codeValidWindow && <Text className="text-sm text-[#E4E7EC]">{codeValidWindow}</Text>}
        <Text className="mt-3 text-sm text-[#F2F4F7]">
          Please don&apos;t share this code with anyone outside your group.
        </Text>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-2">
          Arrival overview
        </Heading>
        <Text className="text-sm text-[#475467]">
          {propertyName} · {arrivalDate} · {arrivalWindow}
        </Text>
      </Section>

      {parkingInfo.length || entrySteps.length ? (
        <Section className="mb-6" style={cardStyle}>
          {[
            { heading: 'Entry', items: entrySteps },
            { heading: 'Parking', items: parkingInfo },
          ]
            .filter((group) => group.items.length)
            .map((group) => (
              <div key={group.heading} style={{ paddingBottom: 12 }}>
                <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
                  {group.heading}
                </Heading>
                {group.items.map((item) => (
                  <div key={item.title}>
                    <Text className="text-sm font-semibold text-[#111827]">{item.title}</Text>
                    <Text className="text-sm text-[#475467]">{item.detail}</Text>
                  </div>
                ))}
              </div>
            ))}
        </Section>
      ) : null}

      {wifi ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Wi-Fi
          </Heading>
          <Text className="text-sm text-[#475467]">Network: <strong>{wifi.network}</strong></Text>
          <Text className="text-sm text-[#475467]">Password: <strong>{wifi.password}</strong></Text>
        </Section>
      ) : null}

      {backupPlan?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Backup plan
          </Heading>
          <div className="space-y-3">
            {backupPlan.map((step) => (
              <div key={step.title}>
                <Text className="text-sm font-semibold text-[#111827]">{step.title}</Text>
                <Text className="text-sm text-[#475467]">{step.detail}</Text>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {securityNotes?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Security reminders
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {securityNotes.map((note) => (
              <li key={note} className="mb-1">{note}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Need help at the door?
        </Heading>
        <Text className="text-sm text-[#475467]">
          Email <a href={`mailto:${support.email}`} className="text-[#7F56D9]">{support.email}</a>
          {support.phone ? (
            <>
              {' '}or call/text <a href={`tel:${support.phone}`} className="text-[#7F56D9]">{support.phone}</a>
            </>
          ) : null}
          {support.concierge ? (
            <>
              {' '}· Concierge line <a href={`tel:${support.concierge}`} className="text-[#7F56D9]">{support.concierge}</a>
            </>
          ) : null}
          .
        </Text>
        {support.note && <Text className="mt-2 text-sm text-[#475467]">{support.note}</Text>}
        <Hr className="my-4 border-[#E4E7EC]" />
        <Text className="text-xs text-[#98A2B3]">
          Keep your photo ID handy—our ops team may verify it if the keypad flags anything unusual.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default DoorCodeEmail;
