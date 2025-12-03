import * as React from 'react';
import { Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface BookingWelcomeInfoItem {
  label: string;
  value: string;
  helper?: string;
}

export interface BookingWelcomeQuickLink {
  label: string;
  href: string;
  description?: string;
}

export interface BookingWelcomeEmailProps {
  guestName: string;
  propertyName: string;
  propertyTagline?: string;
  introMessage?: string;
  stayInfo: BookingWelcomeInfoItem[];
  quickLinks: BookingWelcomeQuickLink[];
  houseRules: string[];
  hostContact: {
    email: string;
    phone?: string;
    note?: string;
  };
  supportDirectory?: { label: string; value: string; helper?: string | null }[];
}

function chunkItems<T>(items: T[], size = 2) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const infoTileStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 16,
  padding: '16px 18px',
  background: '#F8FAFC',
};

const quickLinkStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '16px 18px',
  borderRadius: 16,
  border: '1px solid #EAECF0',
  textDecoration: 'none',
  color: '#111827',
  background: '#FFFFFF',
};

export function BookingWelcomeEmail(props: BookingWelcomeEmailProps) {
  const {
    guestName,
    propertyName,
    propertyTagline,
    introMessage = 'Here is everything you need for a smooth arrival, tailored tips, and quick links to reference later.',
    stayInfo,
    quickLinks,
    houseRules,
    hostContact,
    supportDirectory,
  } = props;
  const stayInfoRows = chunkItems(stayInfo);
  const quickLinkRows = chunkItems(quickLinks);

  return (
    <EmailLayout previewText={`Welcome to ${propertyName}`}> 
      <Text className="text-sm uppercase tracking-widest text-[#7F56D9] font-semibold mb-2">Booking Details</Text>
      <Heading className="text-3xl font-semibold mb-3">You&rsquo;re all set for {propertyName}</Heading>
      <Text className="text-base text-[#475467] mb-4">
        Hi {guestName}, {introMessage}
      </Text>
      {propertyTagline && (
        <Text className="text-base text-[#101828] font-medium mb-6">{propertyTagline}</Text>
      )}

      <Section className="mb-8">
        {stayInfoRows.map((row, rowIndex) => (
          <Row key={`stay-info-${rowIndex}`}>
            {row.map((item, columnIndex) => {
              const isSolo = row.length === 1;
              const columnWidth = isSolo ? '100%' : '50%';
              return (
                <Column
                  key={item.label}
                  style={{
                    width: columnWidth,
                    maxWidth: columnWidth,
                    minWidth: isSolo ? '100%' : 240,
                    paddingRight: !isSolo && columnIndex === 0 ? 12 : 0,
                    paddingLeft: !isSolo && columnIndex === row.length - 1 ? 12 : 0,
                    paddingBottom: 12,
                    verticalAlign: 'top',
                  }}
                >
                  <div style={infoTileStyle}>
                    <Text className="text-xs uppercase tracking-wide text-[#667085] mb-1">{item.label}</Text>
                    <Text className="text-lg font-semibold text-[#101828]">{item.value}</Text>
                    {item.helper && <Text className="text-sm text-[#475467] mt-1">{item.helper}</Text>}
                  </div>
                </Column>
              );
            })}
          </Row>
        ))}
      </Section>

      <Section className="mb-8">
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          Quick links
        </Heading>
        {quickLinkRows.map((row, rowIndex) => (
          <Row key={`quick-link-${rowIndex}`}>
            {row.map((link, columnIndex) => {
              const isSolo = row.length === 1;
              const columnWidth = isSolo ? '100%' : '50%';
              return (
                <Column
                  key={link.label}
                  style={{
                    width: columnWidth,
                    maxWidth: columnWidth,
                    minWidth: isSolo ? '100%' : 240,
                    paddingRight: !isSolo && columnIndex === 0 ? 12 : 0,
                    paddingLeft: !isSolo && columnIndex === row.length - 1 ? 12 : 0,
                    paddingBottom: 12,
                    verticalAlign: 'top',
                  }}
                >
                  <a href={link.href} style={quickLinkStyle}>
                    <span style={{ fontWeight: 600 }}>{link.label}</span>
                    {link.description && <span style={{ color: '#475467', fontSize: 14 }}>{link.description}</span>}
                  </a>
                </Column>
              );
            })}
          </Row>
        ))}
      </Section>

      <Section className="mb-8">
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          House rules &amp; reminders
        </Heading>
        <div className="rounded-2xl border border-[#EAECF0] bg-[#F8FAFC] p-4">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {houseRules.map((rule) => (
              <li key={rule} className="text-sm text-[#475467] mb-2">
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section className="mb-8">
        <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
          We&rsquo;re here for you
        </Heading>
        <div className="rounded-2xl border border-[#EAECF0] p-4">
          <Text className="text-base font-semibold text-[#101828] mb-1">Host support</Text>
          <Text className="text-sm text-[#475467] mb-2">Email: <a href={`mailto:${hostContact.email}`} className="text-[#7F56D9]">{hostContact.email}</a></Text>
          {hostContact.phone && (
            <Text className="text-sm text-[#475467] mb-2">Phone: <a href={`tel:${hostContact.phone}`} className="text-[#7F56D9]">{hostContact.phone}</a></Text>
          )}
          {hostContact.note && <Text className="text-sm text-[#475467]">{hostContact.note}</Text>}
          {supportDirectory?.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {supportDirectory.map((entry) => (
                <div key={`${entry.label}-${entry.value}`} className="rounded-2xl border border-[#EAECF0] bg-[#F8F9FC] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">{entry.label}</p>
                  <p className="text-sm font-semibold text-[#101828]">{entry.value}</p>
                  {entry.helper && <p className="text-xs text-[#475467] mt-1">{entry.helper}</p>}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Section>

      <Hr className="my-8 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">
        Save this email so arrival info, quick links, and support contacts are always handy.
      </Text>
    </EmailLayout>
  );
}

export default BookingWelcomeEmail;
