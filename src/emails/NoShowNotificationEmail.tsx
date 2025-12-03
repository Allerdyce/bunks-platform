import * as React from 'react';
import { Column, Heading, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface NoShowChargeLine {
  label: string;
  amount: string;
  note?: string;
}

export interface NoShowNextStep {
  label: string;
  detail: string;
}

export interface NoShowNotificationEmailProps {
  guestName: string;
  propertyName: string;
  bookingId: number | string;
  stayDates: string;
  reportedAt: string;
  checkInWindow: string;
  arrivalStatus: string;
  charges?: NoShowChargeLine[];
  totalRetained?: string;
  retentionNote?: string;
  nextSteps?: NoShowNextStep[];
  rebookOffer?: {
    headline: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
    note?: string;
  };
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

export function NoShowNotificationEmail(props: NoShowNotificationEmailProps) {
  const {
    guestName,
    propertyName,
    bookingId,
    stayDates,
    reportedAt,
    checkInWindow,
    arrivalStatus,
    charges,
    totalRetained,
    retentionNote,
    nextSteps,
    rebookOffer,
    support,
  } = props;

  return (
    <EmailLayout previewText={`We marked booking ${bookingId} as a no-show`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">No-show status</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          We didn&apos;t see an arrival, {guestName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          Our team monitored {propertyName} during the {checkInWindow} window on {stayDates}. As of {reportedAt}, we still
          haven&apos;t seen a check-in, so the reservation is marked as a no-show.
        </Text>
        <Text className="mt-2 text-sm text-[#475467]">
          Arrival status noted: <strong>{arrivalStatus}</strong>
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
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          Charges & retained funds
        </Heading>
        {charges?.length ? (
          <div className="space-y-3">
            {charges.map((charge) => (
              <Row key={charge.label} style={{ alignItems: 'center' }}>
                <Column style={{ width: '65%', paddingRight: 8 }}>
                  <Text className="text-base text-[#101828]">{charge.label}</Text>
                  {charge.note ? <Text className="text-xs text-[#98A2B3]">{charge.note}</Text> : null}
                </Column>
                <Column style={{ width: '35%', textAlign: 'right' }}>
                  <Text className="text-base font-semibold text-[#101828]">{charge.amount}</Text>
                </Column>
              </Row>
            ))}
          </div>
        ) : (
          <Text className="text-sm text-[#475467]">No additional charges were applied beyond the standard policy.</Text>
        )}
        {totalRetained ? (
          <div style={{ borderTop: '1px solid #EAECF0', marginTop: 16, paddingTop: 16 }}>
            <Row>
              <Column style={{ width: '60%' }}>
                <Text className="text-base font-semibold text-[#101828]">Total retained</Text>
              </Column>
              <Column style={{ width: '40%', textAlign: 'right' }}>
                <Text className="text-2xl font-semibold text-[#101828]">{totalRetained}</Text>
              </Column>
            </Row>
            {retentionNote ? <Text className="text-sm text-[#475467] mt-2">{retentionNote}</Text> : null}
          </div>
        ) : null}
      </Section>

      {nextSteps?.length ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#F8F9FC' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            If plans change
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {nextSteps.map((step) => (
              <li key={step.label} className="mb-1">
                <strong>{step.label}:</strong> {step.detail}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {rebookOffer ? (
        <Section className="mb-6" style={{ ...cardStyle, borderColor: '#D9D6FE', background: '#F4F3FF' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            {rebookOffer.headline}
          </Heading>
          <Text className="text-sm text-[#475467]">{rebookOffer.description}</Text>
          <a
            href={rebookOffer.ctaUrl}
            style={{
              display: 'inline-block',
              marginTop: 16,
              padding: '10px 20px',
              borderRadius: 999,
              background: '#7F56D9',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {rebookOffer.ctaLabel}
          </a>
          {rebookOffer.note ? <Text className="mt-3 text-xs text-[#475467]">{rebookOffer.note}</Text> : null}
        </Section>
      ) : null}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Need to discuss?
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

export default NoShowNotificationEmail;
