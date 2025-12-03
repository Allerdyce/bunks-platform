import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface ListingHighlightItem {
  label: string;
  detail: string;
  badge?: string;
}

export interface ListingActionItem {
  label: string;
  description: string;
  status?: 'recommended' | 'optional' | 'done';
}

export interface PhotoStatItem {
  label: string;
  value: string;
  helper?: string;
}

export interface HostListingReadyEmailProps {
  hostName?: string;
  propertyName: string;
  previewUrl: string;
  summary: string;
  highlights?: ListingHighlightItem[];
  actions?: ListingActionItem[];
  photoStats?: PhotoStatItem[];
  goLiveEta?: string;
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

export function HostListingReadyEmail(props: HostListingReadyEmailProps) {
  const { hostName, propertyName, previewUrl, summary, highlights, actions, photoStats, goLiveEta } = props;

  const preview = `Listing ready for review · ${propertyName}`;

  return (
    <EmailLayout previewText={preview} footerText="Generated once the AI listing draft + photos finish processing.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Listing ready</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {hostName ? `${hostName}, your listing draft is ready` : 'Your listing draft is ready'}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">{summary}</Text>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <a href={previewUrl} style={{ ...chipStyle, borderColor: '#7F56D9', color: '#7F56D9', textDecoration: 'none' }}>
            Review listing
          </a>
          {goLiveEta ? <span style={chipStyle}>Launch ETA {goLiveEta}</span> : null}
        </div>
      </Section>

      {highlights?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828]">Highlights</Heading>
          <div className="mt-3 space-y-2">
            {highlights.map((highlight) => (
              <div key={highlight.label} style={{ borderBottom: '1px solid #F2F4F7', paddingBottom: 12 }}>
                <Text className="text-base font-semibold text-[#101828]">{highlight.label}</Text>
                <Text className="text-sm text-[#475467]">{highlight.detail}</Text>
                {highlight.badge ? <Text className="text-xs text-[#7F56D9]">{highlight.badge}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {photoStats?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Photo coverage</Heading>
          <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {photoStats.map((stat) => (
              <div key={stat.label} style={{ border: '1px solid #F2F4F7', borderRadius: 14, padding: '12px 14px' }}>
                <Text className="text-xs uppercase tracking-[0.3em] text-[#98A2B3]">{stat.label}</Text>
                <Text className="mt-1 text-xl font-semibold text-[#101828]">{stat.value}</Text>
                {stat.helper ? <Text className="text-xs text-[#667085]">{stat.helper}</Text> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {actions?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Suggested edits</Heading>
          <div className="mt-3 space-y-2">
            {actions.map((action) => (
              <Row key={action.label} style={{ borderBottom: '1px solid #F2F4F7', padding: '8px 0' }}>
                <Column style={{ width: '70%' }}>
                  <Text className="text-base font-semibold text-[#101828]">{action.label}</Text>
                  <Text className="text-sm text-[#475467]">{action.description}</Text>
                </Column>
                <Column style={{ width: '30%', textAlign: 'right' }}>
                  {action.status ? (
                    <Text className="text-sm font-semibold" style={{ color: action.status === 'done' ? '#027A48' : action.status === 'recommended' ? '#7F56D9' : '#98A2B3' }}>
                      {action.status}
                    </Text>
                  ) : null}
                </Column>
              </Row>
            ))}
          </div>
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">Approve inside the preview link above or reply with edits for our copy team.</Text>
    </EmailLayout>
  );
}

export default HostListingReadyEmail;
