import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface RefundLineItem {
  label: string;
  amount: string;
  type: 'credit' | 'charge';
  note?: string;
}

export interface CalendarActionItem {
  label: string;
  detail?: string;
  status?: 'done' | 'pending' | 'in-progress';
}

export interface HostGuestCancelledEmailProps {
  hostName?: string;
  propertyName: string;
  guestName: string;
  cancelledAt: string;
  stayDates: string;
  policyApplied: string;
  refundSummary?: { guestRefund: string; hostPayoutChange: string; retention: string };
  lineItems?: RefundLineItem[];
  calendarActions?: CalendarActionItem[];
  rebookNote?: string;
  nextArrival?: string;
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

export function HostGuestCancelledEmail(props: HostGuestCancelledEmailProps) {
  const { hostName, propertyName, guestName, cancelledAt, stayDates, policyApplied, refundSummary, lineItems, calendarActions, rebookNote, nextArrival, attachments } = props;

  const preview = `Guest cancelled at ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Sent the moment a cancellation finalizes in Stripe / PMS.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Guest cancelled</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, ` : ''}{guestName} cancelled their stay
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          We processed the cancellation on {cancelledAt}. Policy applied: {policyApplied}.
        </Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{stayDates}</span>
          <span style={chipStyle}>Policy {policyApplied}</span>
          {nextArrival ? <span style={chipStyle}>Next arrival {nextArrival}</span> : null}
        </div>
      </Section>

      {refundSummary ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828]">Money flow</Heading>
          <Row style={{ marginTop: 16 }}>
            <Column style={{ width: '33%', textAlign: 'center', padding: '0 8px' }}>
              <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]" style={{ display: 'block', marginBottom: 6 }}>Guest refund</Text>
              <Text className="text-2xl font-semibold text-[#101828]">{refundSummary.guestRefund}</Text>
            </Column>
            <Column style={{ width: '33%', textAlign: 'center', padding: '0 8px' }}>
              <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]" style={{ display: 'block', marginBottom: 6 }}>Host payout change</Text>
              <Text className="text-2xl font-semibold text-[#101828]">{refundSummary.hostPayoutChange}</Text>
            </Column>
            <Column style={{ width: '33%', textAlign: 'center', padding: '0 8px' }}>
              <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]" style={{ display: 'block', marginBottom: 6 }}>Retained by Bunks</Text>
              <Text className="text-2xl font-semibold text-[#101828]">{refundSummary.retention}</Text>
            </Column>
          </Row>
        </Section>
      ) : null}

      {lineItems?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Ledger adjustments</Heading>
          <div className="mt-3 space-y-2">
            {lineItems.map((item) => (
              <Row key={item.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '65%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                  {item.note ? <Text className="text-sm text-[#475467]">{item.note}</Text> : null}
                </Column>
                <Column style={{ width: '35%', textAlign: 'right' }}>
                  <Text className="text-base font-semibold text-[#101828]">{item.amount}</Text>
                  <Text className="text-xs text-[#98A2B3]">{item.type === 'credit' ? 'Credit' : 'Charge'}</Text>
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {calendarActions?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Calendar actions</Heading>
          <div className="mt-3 space-y-2">
            {calendarActions.map((action) => (
              <Row key={action.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '60%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{action.label}</Text>
                  {action.detail ? <Text className="text-sm text-[#475467]">{action.detail}</Text> : null}
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  {action.status ? (
                    <Text className="text-sm font-semibold" style={{ color: action.status === 'done' ? '#027A48' : action.status === 'in-progress' ? '#7F56D9' : '#B54708' }}>
                      {action.status.replace('-', ' ')}
                    </Text>
                  ) : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      {rebookNote ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Rebooking plan</Heading>
          <Text className="text-sm text-[#475467]">{rebookNote}</Text>
        </Section>
      ) : null}

      {attachments?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Reference links</Heading>
          <div className="mt-3 flex flex-col gap-2">
            {attachments.map((attachment) => (
              <a key={attachment.href} href={attachment.href} className="text-sm text-[#7F56D9]">
                {attachment.label}
                {attachment.description ? (
                  <span style={{ display: 'block', color: '#475467' }}>{attachment.description}</span>
                ) : null}
              </a>
            ))}
          </div>
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">Auto-sent and logged once Stripe + PMS confirm a cancellation.</Text>
    </EmailLayout>
  );
}

export default HostGuestCancelledEmail;
