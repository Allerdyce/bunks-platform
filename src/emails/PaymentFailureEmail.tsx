import * as React from 'react';
import { Column, Heading, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface PaymentFailureActionItem {
  label: string;
  detail: string;
}

export interface PaymentFailureEmailProps {
  guestName: string;
  propertyName: string;
  bookingId: number | string;
  stayDates: string;
  amountDue: string;
  dueBy: string;
  failureReason: string;
  lastAttempt: string;
  paymentLink: string;
  alternateMethods?: string[];
  actionItems?: PaymentFailureActionItem[];
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

export function PaymentFailureEmail(props: PaymentFailureEmailProps) {
  const {
    guestName,
    propertyName,
    bookingId,
    stayDates,
    amountDue,
    dueBy,
    failureReason,
    lastAttempt,
    paymentLink,
    alternateMethods,
    actionItems,
    support,
  } = props;

  const effectiveActionItems =
    actionItems?.length
      ? actionItems
      : [
          {
            label: 'Confirm card details',
            detail: 'Double-check postal code, expiration, and CVV match your bank records.',
          },
          {
            label: 'Try another method',
            detail: 'Apple Pay, Google Pay, or bank transfer are available at the link below.',
          },
          {
            label: 'Let us know',
            detail: 'Reply if you need a couple extra hours—we can hold the reservation with a quick note.',
          },
        ];

  return (
    <EmailLayout previewText={`Action needed: payment issue for booking ${bookingId}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#B42318]">Action needed</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Payment didn&apos;t go through, {guestName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          We tried to run your {propertyName} booking payment on {lastAttempt}, but it was declined ({failureReason}). Use the
          link below to complete payment and keep your {stayDates} stay locked in.
        </Text>
        <div className="mt-4 inline-flex flex-wrap gap-12">
          <span className="rounded-full border border-[#E4E7EC] bg-[#F8F9FC] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]">
            Booking #{bookingId}
          </span>
          <span className="rounded-full border border-[#E4E7EC] bg-[#F8F9FC] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]">
            {stayDates}
          </span>
        </div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Row>
          <Column style={{ width: '50%', minWidth: 240, paddingRight: 10 }}>
            <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">Amount due</Text>
            <Text className="text-2xl font-semibold text-[#101828] mt-1">{amountDue}</Text>
          </Column>
          <Column style={{ width: '50%', minWidth: 240, paddingLeft: 10 }}>
            <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">Due by</Text>
            <Text className="text-base font-semibold text-[#101828] mt-1">{dueBy}</Text>
          </Column>
        </Row>
        <a
          href={paymentLink}
          style={{
            display: 'inline-block',
            marginTop: 18,
            padding: '12px 20px',
            borderRadius: 999,
            background: '#7F56D9',
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Complete payment →
        </a>
        <Text className="text-xs text-[#98A2B3] mt-2">The secure link expires automatically after the due time above.</Text>
      </Section>

      <Section className="mb-6" style={{ ...cardStyle, background: '#FDF2F2', borderColor: '#FEE4E2' }}>
        <Heading as="h3" className="text-lg font-semibold text-[#B42318] mb-2">
          What to do next
        </Heading>
        <ul className="list-disc pl-5 text-sm text-[#B42318]">
          {effectiveActionItems.map((item) => (
            <li key={item.label} className="mb-1">
              <strong>{item.label}:</strong> {item.detail}
            </li>
          ))}
        </ul>
      </Section>

      {alternateMethods?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Other ways to pay
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {alternateMethods.map((method) => (
              <li key={method} className="mb-1">{method}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Need a hand?
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
        {support.note ? <Text className="mt-2 text-sm text-[#475467]">{support.note}</Text> : null}
      </Section>
    </EmailLayout>
  );
}

export default PaymentFailureEmail;
