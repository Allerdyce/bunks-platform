import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface AddOnDetail {
  name: string;
  summary: string;
  status?: string;
  scheduledFor?: string;
  meetingPoint?: string;
  provider?: string;
  price?: string;
  note?: string;
}

export interface AddOnConfirmationEmailProps {
  guestName: string;
  propertyName: string;
  arrivalDate: string;
  addOns: AddOnDetail[];
  manageAddOnsUrl?: string;
  guestBookUrl?: string;
  total?: string;
  paymentMethod?: string;
  chargedAt?: string;
  cancellationWindow?: string;
  checklist?: string[];
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

const badgeStyle: React.CSSProperties = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 999,
  border: '1px solid #B2A4FF',
  color: '#7F56D9',
  background: '#F4F3FF',
  fontWeight: 600,
};

export function AddOnConfirmationEmail(props: AddOnConfirmationEmailProps) {
  const {
    guestName,
    propertyName,
    arrivalDate,
    addOns,
    manageAddOnsUrl,
    guestBookUrl,
    total,
    paymentMethod,
    chargedAt,
    cancellationWindow,
    checklist,
    support,
  } = props;

  return (
    <EmailLayout previewText={`Your add-ons for ${propertyName} are confirmed`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Add-ons confirmed</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Hey {guestName}, every experience is locked in for {propertyName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Arrival {arrivalDate}. Save these details so you know when to expect each partner and how to reach support.
        </Text>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          Your experiences
        </Heading>
        <div className="divide-y divide-[#EAECF0]">
          {addOns.map((addOn) => (
            <div key={addOn.name} className="py-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <Text className="text-base font-semibold text-[#101828]">{addOn.name}</Text>
                {addOn.status && <span style={badgeStyle}>{addOn.status}</span>}
              </div>
              <Text className="text-sm text-[#475467] mt-1">{addOn.summary}</Text>
              <div className="mt-3 grid" style={{ rowGap: 6 }}>
                {addOn.scheduledFor && (
                  <Text className="text-sm text-[#475467]"><strong>When:</strong> {addOn.scheduledFor}</Text>
                )}
                {addOn.meetingPoint && (
                  <Text className="text-sm text-[#475467]"><strong>Meeting point:</strong> {addOn.meetingPoint}</Text>
                )}
                {addOn.provider && (
                  <Text className="text-sm text-[#475467]"><strong>Provider:</strong> {addOn.provider}</Text>
                )}
                {addOn.price && (
                  <Text className="text-sm text-[#475467]"><strong>Price:</strong> {addOn.price}</Text>
                )}
                {addOn.note && (
                  <Text className="text-sm text-[#475467]"><strong>Notes:</strong> {addOn.note}</Text>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {(manageAddOnsUrl || guestBookUrl) && (
        <Section className="mb-6">
          <Row>
            {manageAddOnsUrl && (
              <Column style={{ width: '50%', minWidth: 240, paddingRight: 8, paddingBottom: 12 }}>
                <a
                  href={manageAddOnsUrl}
                  style={{
                    ...cardStyle,
                    display: 'block',
                    textDecoration: 'none',
                    color: '#101828',
                  }}
                >
                  <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9] mb-2">Manage</Text>
                  <Text className="text-base font-semibold mb-1">Update add-ons</Text>
                  <Text className="text-sm text-[#475467]">
                    Review schedules, share dietary notes, or cancel before the cutoff.
                  </Text>
                </a>
              </Column>
            )}
            {guestBookUrl && (
              <Column style={{ width: '50%', minWidth: 240, paddingLeft: 8, paddingBottom: 12 }}>
                <a
                  href={guestBookUrl}
                  style={{
                    ...cardStyle,
                    display: 'block',
                    textDecoration: 'none',
                    color: '#101828',
                  }}
                >
                  <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9] mb-2">Plan ahead</Text>
                  <Text className="text-base font-semibold mb-1">Open the guest book</Text>
                  <Text className="text-sm text-[#475467]">
                    Insider favorites, driving directions, and concierge-only perks.
                  </Text>
                </a>
              </Column>
            )}
          </Row>
        </Section>
      )}

      {(total || paymentMethod || chargedAt) && (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Billing snapshot
          </Heading>
          {total && <Text className="text-sm text-[#475467]"><strong>Total charged:</strong> {total}</Text>}
          {paymentMethod && (
            <Text className="text-sm text-[#475467] mt-1"><strong>Payment method:</strong> {paymentMethod}</Text>
          )}
          {chargedAt && (
            <Text className="text-sm text-[#475467] mt-1"><strong>Processed:</strong> {chargedAt}</Text>
          )}
          {cancellationWindow && (
            <Text className="text-sm text-[#475467] mt-3">
              Cancel or modify add-ons until {cancellationWindow}. After that window, partner fees may apply.
            </Text>
          )}
        </Section>
      )}

      {checklist?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            What we still need
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {checklist.map((item) => (
              <li key={item} className="mb-1">{item}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5 mb-4">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Need concierge help?
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
      </Section>

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Save this email for receipts and on-the-ground logistics. Each add-on partner receives your name and arrival window only.
      </Text>
    </EmailLayout>
  );
}

export default AddOnConfirmationEmail;
