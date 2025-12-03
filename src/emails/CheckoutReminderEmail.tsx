import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface CheckoutStep {
  label: string;
  detail: string;
}

export interface CheckoutReminderEmailProps {
  guestName: string;
  propertyName: string;
  checkoutDate: string;
  checkoutTime: string;
  cleanerArrivalWindow?: string;
  lateCheckoutNote?: string;
  propertyAddress?: string;
  directionsUrl?: string;
  parkingNote?: string;
  keySteps: CheckoutStep[];
  kitchenReminders?: string[];
  laundryReminders?: string[];
  lockupSteps?: string[];
  trashNote?: string;
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
  padding: '20px 22px',
  background: '#FFFFFF',
};

const pillStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export function CheckoutReminderEmail(props: CheckoutReminderEmailProps) {
  const {
    guestName,
    propertyName,
    checkoutDate,
    checkoutTime,
    cleanerArrivalWindow,
    lateCheckoutNote,
    propertyAddress,
    directionsUrl,
    parkingNote,
    keySteps,
    kitchenReminders,
    laundryReminders,
    lockupSteps,
    trashNote,
    support,
  } = props;

  return (
    <EmailLayout previewText={`Checkout reminder for ${propertyName}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Checkout prep</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Tomorrow&apos;s checkout at {propertyName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Hey {guestName}, here&apos;s a friendly reminder so checkout is effortless and our cleaners can dive right in.
        </Text>
        <div style={{ marginTop: 20, display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ ...pillStyle, border: '1px solid #D0D5DD', color: '#101828', background: '#F8F9FC' }}>
            {checkoutDate}
          </div>
          <div style={{ ...pillStyle, border: '1px solid #D0D5DD', color: '#101828', background: '#F8F9FC' }}>
            Checkout by {checkoutTime}
          </div>
          {cleanerArrivalWindow && (
            <div style={{ ...pillStyle, border: '1px solid #F2F4F7', color: '#B42318', background: '#FEF3F2' }}>
              Cleaners arrive {cleanerArrivalWindow}
            </div>
          )}
        </div>
        {lateCheckoutNote && (
          <Text className="mt-3 text-sm text-[#B54708] bg-[#FEF0C7] border border-[#FEDF89] rounded-2xl px-4 py-3">
            {lateCheckoutNote}
          </Text>
        )}
      </Section>

      {(propertyAddress || directionsUrl || parkingNote) && (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
            Departure logistics
          </Heading>
          {propertyAddress && (
            <Text className="text-sm text-[#475467]">
              <strong>Address:</strong> {propertyAddress}
            </Text>
          )}
          {directionsUrl && (
            <Text className="text-sm text-[#475467] mt-1">
              <a href={directionsUrl} className="text-[#7F56D9]">Open directions</a>
            </Text>
          )}
          {parkingNote && (
            <Text className="text-sm text-[#475467] mt-3">{parkingNote}</Text>
          )}
        </Section>
      )}

      {keySteps?.length ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#F8F9FC' }}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
            Pre-checkout checklist
          </Heading>
          <div className="space-y-4">
            {keySteps.map((step) => (
              <div key={step.label} style={{ borderBottom: '1px solid #EAECF0', paddingBottom: 12 }}>
                <Text className="text-sm uppercase tracking-[0.3em] text-[#98A2B3]">{step.label}</Text>
                <Text className="text-base text-[#101828] mt-1">{step.detail}</Text>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {(kitchenReminders?.length || laundryReminders?.length) && (
        <Section className="mb-6">
          <Row>
            {kitchenReminders?.length ? (
              <Column style={{ width: '50%', minWidth: 240, paddingRight: 8, paddingBottom: 12 }}>
                <div style={cardStyle}>
                  <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9] mb-2">Kitchen reset</Text>
                  <ul className="list-disc pl-5 text-sm text-[#475467]">
                    {kitchenReminders.map((item) => (
                      <li key={item} className="mb-1">{item}</li>
                    ))}
                  </ul>
                </div>
              </Column>
            ) : null}
            {laundryReminders?.length ? (
              <Column style={{ width: '50%', minWidth: 240, paddingLeft: 8, paddingBottom: 12 }}>
                <div style={cardStyle}>
                  <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9] mb-2">Laundry</Text>
                  <ul className="list-disc pl-5 text-sm text-[#475467]">
                    {laundryReminders.map((item) => (
                      <li key={item} className="mb-1">{item}</li>
                    ))}
                  </ul>
                </div>
              </Column>
            ) : null}
          </Row>
        </Section>
      )}

      {(lockupSteps?.length || trashNote) && (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Lock-up & trash
          </Heading>
          {trashNote && <Text className="text-sm text-[#475467] mb-3">{trashNote}</Text>}
          {lockupSteps?.length ? (
            <ul className="list-disc pl-5 text-sm text-[#475467]">
              {lockupSteps.map((item) => (
                <li key={item} className="mb-1">{item}</li>
              ))}
            </ul>
          ) : null}
        </Section>
      )}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Need a hand tomorrow?
        </Heading>
        <Text className="text-sm text-[#475467]">
          Email <a href={`mailto:${support.email}`} className="text-[#7F56D9]">{support.email}</a>
          {support.phone ? (
            <>
              {' '}or text <a href={`tel:${support.phone}`} className="text-[#7F56D9]">{support.phone}</a>
            </>
          ) : null}
          {support.concierge ? (
            <>
              {' '}· concierge line <a href={`tel:${support.concierge}`} className="text-[#7F56D9]">{support.concierge}</a>
            </>
          ) : null}
          .
        </Text>
        {support.note && <Text className="mt-2 text-sm text-[#475467]">{support.note}</Text>}
      </Section>

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Checkout reminders help us reset {propertyName} without delays. Reply directly to adjust timing or ask for a concierge assist.
      </Text>
    </EmailLayout>
  );
}

export default CheckoutReminderEmail;
