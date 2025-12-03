import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export type VerificationStatus = 'approved' | 'in-review' | 'needs-info' | 'pending';

export interface VerificationTrackItem {
  label: string;
  status: VerificationStatus;
  detail?: string;
  owner?: string;
}

export interface OutstandingItem {
  label: string;
  description: string;
  actionUrl?: string;
  due?: string;
}

export interface HostVerificationProgressEmailProps {
  hostName?: string;
  propertyName: string;
  expectedGoLive: string;
  tracks: VerificationTrackItem[];
  outstanding?: OutstandingItem[];
  approvedItems?: string[];
  notes?: string;
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

const statusStyles: Record<VerificationStatus, { label: string; color: string }> = {
  approved: { label: 'Approved', color: '#027A48' },
  'in-review': { label: 'In review', color: '#7F56D9' },
  'needs-info': { label: 'Needs info', color: '#B54708' },
  pending: { label: 'Pending', color: '#98A2B3' },
};

export function HostVerificationProgressEmail(props: HostVerificationProgressEmailProps) {
  const { hostName, propertyName, expectedGoLive, tracks, outstanding, approvedItems, notes } = props;

  const preview = `Verification progress for ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Verification updates send weekly until go-live.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Verification</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, here&rsquo;s where verification stands` : 'Here&rsquo;s where verification stands'}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          {propertyName} is pacing toward go-live around {expectedGoLive}. See status by track below.
        </Text>
        <div style={{ marginTop: 18 }}>
          <span style={chipStyle}>Target go-live {expectedGoLive}</span>
        </div>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">Tracks</Heading>
        <div className="mt-3 space-y-2">
          {tracks.map((track) => (
            <Row key={track.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
              <Column style={{ width: '60%' }}>
                <Text className="text-base font-semibold text-[#101828]">{track.label}</Text>
                {track.detail ? <Text className="text-sm text-[#475467]">{track.detail}</Text> : null}
                {track.owner ? <Text className="text-xs text-[#98A2B3]">Owner · {track.owner}</Text> : null}
              </Column>
              <Column style={{ width: '40%', textAlign: 'right' }}>
                <Text className="text-sm font-semibold" style={{ color: statusStyles[track.status].color }}>
                  {statusStyles[track.status].label}
                </Text>
              </Column>
            </Row>
          ))}
        </div>
      </Section>

      {outstanding?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Outstanding items</Heading>
          <div className="mt-3 space-y-2">
            {outstanding.map((item) => (
              <div key={item.label} style={{ borderBottom: '1px solid #F2F4F7', paddingBottom: 12 }}>
                <Text className="text-base font-semibold text-[#101828]">{item.label}</Text>
                <Text className="text-sm text-[#475467]">{item.description}</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  {item.due ? <Text className="text-xs text-[#98A2B3]">Due {item.due}</Text> : <span />}
                  {item.actionUrl ? (
                    <a href={item.actionUrl} className="text-xs font-semibold text-[#7F56D9]">
                      Upload / complete
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {approvedItems?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Recently approved</Heading>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#475467]">
            {approvedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {notes ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Notes</Heading>
          <Text className="text-sm text-[#475467]">{notes}</Text>
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">Need to fast-track anything? Reply and ops will jump in within a business day.</Text>
    </EmailLayout>
  );
}

export default HostVerificationProgressEmail;
