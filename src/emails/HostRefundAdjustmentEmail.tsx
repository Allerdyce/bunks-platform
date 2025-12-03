import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface AdjustmentLineItem {
  label: string;
  amount: string;
  direction: 'credit' | 'debit';
  note?: string;
}

export interface AdjustmentTimelineItem {
  time: string;
  label: string;
  status?: 'pending' | 'done' | 'in-progress';
  detail?: string;
}

export interface HostRefundAdjustmentEmailProps {
  hostName?: string;
  propertyName: string;
  guestName: string;
  bookingId: number | string;
  processedAt: string;
  adjustmentReason: string;
  payoutBefore: string;
  payoutAfter: string;
  guestRefund: string;
  adjustments: AdjustmentLineItem[];
  timeline?: AdjustmentTimelineItem[];
  documents?: { label: string; href: string; description?: string }[];
  supportNote?: string;
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

export function HostRefundAdjustmentEmail(props: HostRefundAdjustmentEmailProps) {
  const {
    hostName,
    propertyName,
    guestName,
    bookingId,
    processedAt,
    adjustmentReason,
    payoutBefore,
    payoutAfter,
    guestRefund,
    adjustments,
    timeline,
    documents,
    supportNote,
  } = props;

  const preview = `Refund adjustment · ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Finance desk sends this when host payouts change after a stay.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Refund adjustment</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, ` : ''}we updated your payout for booking #{bookingId}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">Reason: {adjustmentReason}. Processed {processedAt} for guest {guestName}.</Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{propertyName}</span>
          <span style={chipStyle}>Guest refund {guestRefund}</span>
          <span style={chipStyle}>Payout now {payoutAfter}</span>
        </div>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">Payout delta</Heading>
        <Row style={{ marginTop: 16 }}>
          <Column style={{ width: '50%' }}>
            <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">Original payout</Text>
            <Text className="text-2xl font-semibold text-[#101828]">{payoutBefore}</Text>
          </Column>
          <Column style={{ width: '50%' }}>
            <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">Updated payout</Text>
            <Text className="text-2xl font-semibold text-[#101828]">{payoutAfter}</Text>
          </Column>
        </Row>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h3" className="text-lg font-semibold text-[#101828]">Ledger entries</Heading>
        <div className="mt-3 space-y-2">
          {adjustments.map((line) => (
            <Row key={line.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
              <Column style={{ width: '65%' }}>
                <Text className="text-base font-semibold text-[#101828]">{line.label}</Text>
                {line.note ? <Text className="text-sm text-[#475467]">{line.note}</Text> : null}
              </Column>
              <Column style={{ width: '35%', textAlign: 'right' }}>
                <Text className="text-base font-semibold text-[#101828]">{line.amount}</Text>
                <Text className="text-xs text-[#98A2B3]">{line.direction === 'credit' ? 'Credit' : 'Debit'}</Text>
              </Column>
            </Row>
          ))}
        </div>
      </Section>

      {timeline?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Timeline</Heading>
          <div className="mt-3 space-y-2">
            {timeline.map((event, index) => (
              <Row key={`${event.label}-${index}`} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '30%' }}>
                  <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">{event.time}</Text>
                </Column>
                <Column style={{ width: '70%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{event.label}</Text>
                  {event.detail ? <Text className="text-sm text-[#475467]">{event.detail}</Text> : null}
                  {event.status ? (
                    <Text className="text-xs text-[#667085]" style={{ textTransform: 'capitalize' }}>
                      {event.status}
                    </Text>
                  ) : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {documents?.length || supportNote ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Docs & support</Heading>
          {supportNote ? <Text className="text-sm text-[#475467]">{supportNote}</Text> : null}
          {documents?.length ? (
            <div className="mt-3 flex flex-col gap-2">
              {documents.map((doc) => (
                <a key={doc.href} href={doc.href} className="text-sm text-[#7F56D9]">
                  {doc.label}
                  {doc.description ? (
                    <span style={{ display: 'block', color: '#475467' }}>{doc.description}</span>
                  ) : null}
                </a>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">Need to dispute? Reply within 48h and finance will review supporting evidence.</Text>
    </EmailLayout>
  );
}

export default HostRefundAdjustmentEmail;
