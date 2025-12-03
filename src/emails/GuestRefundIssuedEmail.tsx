import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface RefundLineItem {
  label: string;
  amount: string;
  note?: string;
}

export interface RefundTimelineItem {
  label: string;
  detail: string;
  status: 'pending' | 'in-progress' | 'complete';
}

export interface GuestRefundIssuedEmailProps {
  guestName: string;
  propertyName: string;
  bookingId: number | string;
  refundTotal: string;
  currencyNote?: string;
  paymentMethod: string;
  statementDescriptor?: string;
  refundReason: string;
  initiatedAt: string;
  expectedArrivalWindow: string;
  lineItems: RefundLineItem[];
  timeline?: RefundTimelineItem[];
  support: {
    email: string;
    phone?: string;
    concierge?: string;
    note?: string;
  };
  extraNotes?: string[];
  policyUrl?: string;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 18,
  padding: '20px 22px',
  background: '#FFFFFF',
};

const statusColor: Record<RefundTimelineItem['status'], { text: string; background: string; border: string }> = {
  pending: { text: '#B54708', background: '#FEF0C7', border: '#FEDF89' },
  'in-progress': { text: '#344054', background: '#F2F4F7', border: '#D0D5DD' },
  complete: { text: '#027A48', background: '#ECFDF3', border: '#ABEFC6' },
};

export function GuestRefundIssuedEmail(props: GuestRefundIssuedEmailProps) {
  const {
    guestName,
    propertyName,
    bookingId,
    refundTotal,
    currencyNote,
    paymentMethod,
    statementDescriptor,
    refundReason,
    initiatedAt,
    expectedArrivalWindow,
    lineItems,
    timeline,
    support,
    extraNotes,
    policyUrl,
  } = props;

  return (
    <EmailLayout previewText={`Refund issued for booking ${bookingId}`}> 
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Refund issued</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {refundTotal} headed back to {paymentMethod}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Hi {guestName}, we processed a refund for booking #{bookingId} at {propertyName}. You&apos;ll see the funds within
          {` ${expectedArrivalWindow}.`}
        </Text>
        <Text className="mt-3 text-sm text-[#475467]">
          Reason: <strong>{refundReason}</strong>
        </Text>
        <div style={{ marginTop: 18, display: 'inline-flex', gap: 12, flexWrap: 'wrap' }}>
          <span
            style={{
              borderRadius: 999,
              border: '1px solid #D0D5DD',
              background: '#F8F9FC',
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            Initiated {initiatedAt}
          </span>
          {currencyNote && (
            <span
              style={{
                borderRadius: 999,
                border: '1px solid #E4E7EC',
                background: '#FFF7F0',
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.5,
                color: '#B54708',
              }}
            >
              {currencyNote}
            </span>
          )}
        </div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          Refund breakdown
        </Heading>
        <div className="space-y-3">
          {lineItems.map((item) => (
            <Row key={item.label} style={{ alignItems: 'baseline' }}>
              <Column style={{ width: '60%', paddingRight: 8 }}>
                <Text className="text-sm text-[#475467]">{item.label}</Text>
                {item.note && (
                  <Text className="text-xs text-[#98A2B3]">{item.note}</Text>
                )}
              </Column>
              <Column style={{ width: '40%', textAlign: 'right' }}>
                <Text className="text-base font-semibold text-[#101828]">{item.amount}</Text>
              </Column>
            </Row>
          ))}
        </div>
        <Hr className="my-4 border-[#EAECF0]" />
        <Row style={{ alignItems: 'center' }}>
          <Column style={{ width: '60%' }}>
            <Text className="text-base font-semibold text-[#101828]">Total refund</Text>
          </Column>
          <Column style={{ width: '40%', textAlign: 'right' }}>
            <Text className="text-2xl font-semibold text-[#101828]">{refundTotal}</Text>
          </Column>
        </Row>
        <Text className="text-sm text-[#475467] mt-3">
          Payment method: {paymentMethod}
          {statementDescriptor ? ` · Statement shows as ${statementDescriptor}` : ''}
        </Text>
      </Section>

      {timeline?.length ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#F8F9FC' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Timeline
          </Heading>
          <div className="space-y-3">
            {timeline.map((item) => {
              const color = statusColor[item.status];
              return (
                <div key={item.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      borderRadius: 999,
                      border: `1px solid ${color.border}`,
                      background: color.background,
                      color: color.text,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 12px',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      minWidth: 90,
                      textAlign: 'center',
                      marginTop: 2,
                    }}
                  >
                    {item.status}
                  </span>
                  <div>
                    <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                    <Text className="text-sm text-[#475467]">{item.detail}</Text>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {(extraNotes?.length || policyUrl) && (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            What to expect
          </Heading>
          {extraNotes?.length ? (
            <ul className="list-disc pl-5 text-sm text-[#475467]">
              {extraNotes.map((note) => (
                <li key={note} className="mb-1">{note}</li>
              ))}
            </ul>
          ) : null}
          {policyUrl && (
            <Text className="text-sm text-[#7F56D9] mt-3">
              <a href={policyUrl} className="text-[#7F56D9]">Review our refund policy</a>
            </Text>
          )}
        </Section>
      )}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Need to follow up?
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
        Booking #{bookingId} · Refund confirmation sent automatically so you have written proof for your records.
      </Text>
    </EmailLayout>
  );
}

export default GuestRefundIssuedEmail;
