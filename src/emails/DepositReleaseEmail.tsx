import * as React from 'react';
import { Column, Heading, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface DepositAdjustmentItem {
  label: string;
  amount: string;
  note?: string;
}

export interface DepositReleaseEmailProps {
  guestName: string;
  propertyName: string;
  bookingId: number | string;
  stayDates: string;
  releasedAt: string;
  depositAmount: string;
  method: string;
  expectedTimeline: string;
  descriptor?: string;
  adjustments?: DepositAdjustmentItem[];
  note?: string;
  tips?: string[];
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

export function DepositReleaseEmail(props: DepositReleaseEmailProps) {
  const {
    guestName,
    propertyName,
    bookingId,
    stayDates,
    releasedAt,
    depositAmount,
    method,
    expectedTimeline,
    descriptor,
    adjustments,
    note,
    tips,
    support,
  } = props;

  return (
    <EmailLayout previewText={`Security deposit released for booking ${bookingId}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#027A48]">Deposit released</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Your hold is on its way back, {guestName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Thanks again for staying at {propertyName}. We just released the security deposit tied to booking #{bookingId} from
          {stayDates}. Your bank handles the final posting, but the details are below for reference.
        </Text>
        <div className="mt-4 inline-flex flex-wrap gap-12">
          <span className="rounded-full border border-[#E4E7EC] bg-[#F8F9FC] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]">
            Booking #{bookingId}
          </span>
          <span className="rounded-full border border-[#E4E7EC] bg-[#F8F9FC] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]">
            Released {releasedAt}
          </span>
        </div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Row>
          <Column style={{ width: '50%', minWidth: 240, paddingRight: 10 }}>
            <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">Amount</Text>
            <Text className="text-2xl font-semibold text-[#101828] mt-1">{depositAmount}</Text>
          </Column>
          <Column style={{ width: '50%', minWidth: 240, paddingLeft: 10 }}>
            <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">Method</Text>
            <Text className="text-base font-semibold text-[#101828] mt-1">{method}</Text>
          </Column>
        </Row>
        <Text className="text-sm text-[#475467] mt-4">
          Expect funds to appear within <strong>{expectedTimeline}</strong>
          {descriptor ? ` · Statement descriptor: ${descriptor}` : ''}.
        </Text>
      </Section>

      {adjustments?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Adjustments applied
          </Heading>
          <div className="space-y-3">
            {adjustments.map((item) => (
              <Row key={item.label} style={{ alignItems: 'baseline' }}>
                <Column style={{ width: '65%', paddingRight: 8 }}>
                  <Text className="text-base text-[#101828]">{item.label}</Text>
                  {item.note ? <Text className="text-xs text-[#98A2B3]">{item.note}</Text> : null}
                </Column>
                <Column style={{ width: '35%', textAlign: 'right' }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.amount}</Text>
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {note ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#F8F9FC' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Heads up
          </Heading>
          <Text className="text-sm text-[#475467]">{note}</Text>
        </Section>
      ) : null}

      {tips?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Still waiting after the window?
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {tips.map((tip) => (
              <li key={tip} className="mb-1">{tip}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Questions about the release?
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

export default DepositReleaseEmail;
