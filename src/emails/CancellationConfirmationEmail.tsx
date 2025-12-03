import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface CancellationRefundLineItem {
  label: string;
  amount: string;
  note?: string;
  retained?: boolean;
}

export interface CancellationPolicyHighlight {
  title: string;
  detail: string;
}

export interface CancellationRebookingOffer {
  headline: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  note?: string;
}

export interface CancellationConfirmationEmailProps {
  guestName: string;
  propertyName: string;
  stayDates: string;
  bookingId: number | string;
  cancelledAt: string;
  cancellationInitiator: string;
  cancellationReason?: string;
  refundTotal: string;
  refundMethod: string;
  refundTimeline: string;
  statementDescriptor?: string;
  refundLineItems: CancellationRefundLineItem[];
  policyHighlights: CancellationPolicyHighlight[];
  rebookingOffer?: CancellationRebookingOffer;
  extraNotes?: string[];
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
  border: '1px solid #E4E7EC',
  background: '#F8F9FC',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
};

export function CancellationConfirmationEmail(props: CancellationConfirmationEmailProps) {
  const {
    guestName,
    propertyName,
    stayDates,
    bookingId,
    cancelledAt,
    cancellationInitiator,
    cancellationReason,
    refundTotal,
    refundMethod,
    refundTimeline,
    statementDescriptor,
    refundLineItems,
    policyHighlights,
    rebookingOffer,
    extraNotes,
    support,
  } = props;

  return (
    <EmailLayout previewText={`Cancellation confirmed for booking ${bookingId}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Cancellation confirmed</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {propertyName} stay cancelled
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Hi {guestName}, we processed the cancellation for booking #{bookingId}. The details below outline refunds, retained
          fees, and how to rebook when you&apos;re ready.
        </Text>
        {cancellationReason ? (
          <Text className="mt-2 text-sm text-[#475467]">
            Reason recorded: <strong>{cancellationReason}</strong>
          </Text>
        ) : null}
        <div style={{ marginTop: 18, display: 'inline-flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={pillStyle}>Booking #{bookingId}</span>
          <span style={pillStyle}>{stayDates}</span>
        </div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          Cancellation snapshot
        </Heading>
        <div className="grid grid-cols-1 gap-3 text-sm text-[#475467]">
          <div>
            <Text className="uppercase text-xs tracking-[0.2em] text-[#98A2B3]">Cancelled</Text>
            <Text className="text-base text-[#101828] font-semibold">{cancelledAt}</Text>
          </div>
          <div>
            <Text className="uppercase text-xs tracking-[0.2em] text-[#98A2B3]">Initiated by</Text>
            <Text className="text-base text-[#101828] font-semibold">{cancellationInitiator}</Text>
          </div>
          <div>
            <Text className="uppercase text-xs tracking-[0.2em] text-[#98A2B3]">Refund method</Text>
            <Text className="text-base text-[#101828] font-semibold">{refundMethod}</Text>
          </div>
          <div>
            <Text className="uppercase text-xs tracking-[0.2em] text-[#98A2B3]">Timeline</Text>
            <Text className="text-base text-[#101828] font-semibold">{refundTimeline}</Text>
          </div>
        </div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
          Refund overview
        </Heading>
        <div className="space-y-3">
          {refundLineItems.map((item) => (
            <Row key={item.label} style={{ alignItems: 'baseline' }}>
              <Column style={{ width: '60%', paddingRight: 8 }}>
                <Text className="text-sm text-[#475467]">{item.label}</Text>
                {item.note && <Text className="text-xs text-[#98A2B3]">{item.note}</Text>}
              </Column>
              <Column style={{ width: '40%', textAlign: 'right' }}>
                <Text className={`text-base font-semibold ${item.retained ? 'text-[#B54708]' : 'text-[#101828]'}`}>
                  {item.amount}
                </Text>
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
          Funds return to {refundMethod}
          {statementDescriptor ? ` · Statement shows as ${statementDescriptor}` : ''}.
        </Text>
        <Text className="text-xs text-[#98A2B3] mt-1">
          Expect processing within {refundTimeline}. Your bank controls final posting speed.
        </Text>
      </Section>

      {policyHighlights?.length ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#F8F9FC' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Policy snapshot
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {policyHighlights.map((policy) => (
              <li key={policy.title} className="mb-1">
                <strong className="text-[#101828]">{policy.title}:</strong> {policy.detail}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {rebookingOffer ? (
        <Section className="mb-6" style={{ ...cardStyle, borderColor: '#D9D6FE', background: '#F5F3FF' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            {rebookingOffer.headline}
          </Heading>
          <Text className="text-sm text-[#475467] mb-4">{rebookingOffer.description}</Text>
          <a
            href={rebookingOffer.ctaUrl}
            style={{
              display: 'inline-block',
              background: '#7F56D9',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 999,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {rebookingOffer.ctaLabel}
          </a>
          {rebookingOffer.note ? (
            <Text className="mt-3 text-xs text-[#475467]">{rebookingOffer.note}</Text>
          ) : null}
        </Section>
      ) : null}

      {extraNotes?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            What happens next
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {extraNotes.map((note) => (
              <li key={note} className="mb-1">
                {note}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Need help rebooking?
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
        Booking #{bookingId} · Cancellation confirmation sent automatically for your records.
      </Text>
    </EmailLayout>
  );
}

export default CancellationConfirmationEmail;
