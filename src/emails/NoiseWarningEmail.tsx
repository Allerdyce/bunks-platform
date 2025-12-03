import * as React from 'react';
import { Column, Heading, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface NoiseWarningGuideline {
  label: string;
  detail: string;
}

export interface NoiseWarningEmailProps {
  guestName: string;
  propertyName: string;
  detectedAt: string;
  quietHours: string;
  alertReason?: string;
  location?: string;
  decibelReading?: string;
  monitorType?: string;
  requestActions?: string[];
  guidelines?: NoiseWarningGuideline[];
  followUpWithin?: string;
  communityNote?: string;
  issueReportingUrl?: string;
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
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 14px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  background: '#FEF3F2',
  border: '1px solid #FECDCA',
  color: '#B42318',
};

const defaultActions = [
  'Lower music/speakers on decks and near open windows.',
  'Close doors or windows if you are hosting on the patio or hot tub area.',
  'Let us know once the volume is down so we can close the alert.',
];

const defaultGuidelines: NoiseWarningGuideline[] = [
  {
    label: 'Patio & balconies',
    detail: 'Keep voices low after 22:00; sound travels quickly across the ridge.',
  },
  {
    label: 'Hot tub',
    detail: 'Cover it when not in use and limit speaker volume to 40% during quiet hours.',
  },
  {
    label: 'Vehicles',
    detail: 'Avoid idling engines or revving in the driveway late at night.',
  },
];

export function NoiseWarningEmail(props: NoiseWarningEmailProps) {
  const {
    guestName,
    propertyName,
    detectedAt,
    quietHours,
    alertReason,
    location,
    decibelReading,
    monitorType,
    requestActions,
    guidelines,
    followUpWithin,
    communityNote,
    issueReportingUrl,
    support,
  } = props;

  return (
    <EmailLayout previewText={`Friendly quiet-hours reminder for ${propertyName}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Courtesy reminder</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Quick sound check, {guestName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          We just received a noise alert tied to {propertyName}. It&apos;s usually an easy fix—bringing the volume down keeps
          neighbors happy and avoids HOA fines.
        </Text>
        <div style={{ ...badgeStyle, marginTop: 16 }}>Quiet hours matter</div>
      </Section>

      <Section className="mb-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-2">
          What we noticed
        </Heading>
        <Text className="text-sm text-[#475467]">
          Detected {detectedAt}
          {location ? ` · near ${location}` : ''}
        </Text>
        {decibelReading && (
          <Text className="text-sm text-[#475467] mt-1">Noise level: {decibelReading}</Text>
        )}
        {monitorType && (
          <Text className="text-sm text-[#475467] mt-1">Source: {monitorType}</Text>
        )}
        <Text className="text-base text-[#101828] mt-4">
          {alertReason ?? 'Neighbors nearby let us know things sounded lively a little past our quiet hours.'}
        </Text>
        <Text className="text-sm text-[#475467] mt-3">
          {communityNote ?? 'Sound carries across the valley after sunset, so a small adjustment helps keep us in good standing with the HOA and neighbors.'}
        </Text>
      </Section>

      <Section className="mb-6">
        <Row>
          <Column style={{ width: '50%', minWidth: 240, paddingRight: 8, paddingBottom: 12 }}>
            <div style={{ ...cardStyle, height: '100%' }}>
              <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
                What we need right now
              </Heading>
              <ul className="list-disc pl-5 text-sm text-[#475467]">
                {(requestActions?.length ? requestActions : defaultActions).map((action) => (
                  <li key={action} className="mb-1">{action}</li>
                ))}
              </ul>
              {followUpWithin && (
                <Text className="mt-3 text-sm text-[#475467]">
                  Reply to this email or text us within {followUpWithin} so we can close the alert.
                </Text>
              )}
            </div>
          </Column>
          <Column style={{ width: '50%', minWidth: 240, paddingLeft: 8, paddingBottom: 12 }}>
            <div style={{ ...cardStyle, height: '100%', background: '#F8FAFC' }}>
              <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
                Quiet hour policy
              </Heading>
              <Text className="text-sm text-[#475467]">
                Please keep noise to conversational levels between <strong>{quietHours}</strong>.
              </Text>
              <div className="mt-3 space-y-2">
                {(guidelines?.length ? guidelines : defaultGuidelines).map((item) => (
                  <div key={item.label}>
                    <Text className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">{item.label}</Text>
                    <Text className="text-sm text-[#475467]">{item.detail}</Text>
                  </div>
                ))}
              </div>
            </div>
          </Column>
        </Row>
      </Section>

      {issueReportingUrl ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#F4F3FF' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Need help or have a concern?
          </Heading>
          <Text className="text-sm text-[#475467]">
            If there&apos;s an emergency or someone else is creating the noise, tap below so our ops desk can jump in.
          </Text>
          <a
            href={issueReportingUrl}
            style={{
              display: 'inline-flex',
              marginTop: 14,
              fontWeight: 600,
              color: '#7F56D9',
              textDecoration: 'none',
            }}
          >
            Open support ticket →
          </a>
        </Section>
      ) : null}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Concierge team
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
        {support.note && (
          <Text className="mt-2 text-sm text-[#475467]">{support.note}</Text>
        )}
      </Section>
    </EmailLayout>
  );
}

export default NoiseWarningEmail;
