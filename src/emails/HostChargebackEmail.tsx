import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export type EvidenceStatus = 'attached' | 'missing' | 'optional';

export interface EvidenceItem {
  label: string;
  detail: string;
  status?: EvidenceStatus;
}

export interface ChargebackTimelineItem {
  time: string;
  label: string;
  detail?: string;
  status?: 'done' | 'pending' | 'in-progress';
}

export interface HostChargebackEmailProps {
  hostName?: string;
  propertyName: string;
  guestName: string;
  disputeId: string;
  amount: string;
  replyBy: string;
  processor: string;
  reason: string;
  narrative: string;
  evidenceNeeded: EvidenceItem[];
  timeline?: ChargebackTimelineItem[];
  links?: { label: string; href: string; description?: string }[];
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

const evidenceStatusColor: Record<EvidenceStatus, string> = {
  attached: '#027A48',
  missing: '#B42318',
  optional: '#7F56D9',
};

export function HostChargebackEmail(props: HostChargebackEmailProps) {
  const { hostName, propertyName, guestName, disputeId, amount, replyBy, processor, reason, narrative, evidenceNeeded, timeline, links, supportNote } = props;

  const preview = `Chargeback filed · ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Finance alerts you immediately so we can respond before the deadline.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Chargeback</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, ` : ''}Stripe opened dispute {disputeId}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">Guest {guestName} contested {amount}. We must reply by {replyBy}.</Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={chipStyle}>{propertyName}</span>
          <span style={chipStyle}>{processor}</span>
          <span style={chipStyle}>Reason · {reason}</span>
        </div>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">What the guest claimed</Heading>
        <Text className="mt-2 text-sm text-[#475467]">{narrative}</Text>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h3" className="text-lg font-semibold text-[#101828]">Evidence checklist</Heading>
        <div className="mt-3 space-y-2">
          {evidenceNeeded.map((item) => (
            <Row key={item.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
              <Column style={{ width: '65%' }}>
                <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                <Text className="text-sm text-[#475467]">{item.detail}</Text>
              </Column>
              <Column style={{ width: '35%', textAlign: 'right' }}>
                {item.status ? (
                  <Text className="text-sm font-semibold" style={{ color: evidenceStatusColor[item.status] }}>
                    {item.status}
                  </Text>
                ) : null}
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

      {links?.length || supportNote ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Helpful links</Heading>
          {supportNote ? <Text className="text-sm text-[#475467]">{supportNote}</Text> : null}
          {links?.length ? (
            <div className="mt-3 flex flex-col gap-2">
              {links.map((link) => (
                <a key={link.href} href={link.href} className="text-sm text-[#7F56D9]">
                  {link.label}
                  {link.description ? (
                    <span style={{ display: 'block', color: '#475467' }}>{link.description}</span>
                  ) : null}
                </a>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">Reply with evidence or drop files in #finance-chargebacks before the deadline.</Text>
    </EmailLayout>
  );
}

export default HostChargebackEmail;
