import * as React from 'react';
import { Column, Heading, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface MidStayCheckInEmailProps {
  guestName: string;
  propertyName: string;
  stayProgress: string;
  vibeLine?: string;
  weatherCallout?: string;
  todaysFocus?: { label: string; detail: string }[];
  housekeepingReminders?: string[];
  guestBookUrl?: string;
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

export function MidStayCheckInEmail(props: MidStayCheckInEmailProps) {
  const {
    guestName,
    propertyName,
    stayProgress,
    vibeLine = 'Hope you slept well! Let us know what would make today even better.',
    weatherCallout,
    todaysFocus,
    housekeepingReminders,
    guestBookUrl,
    issueReportingUrl,
    support,
  } = props;

  return (
    <EmailLayout previewText={`Day-of concierge check-in for ${propertyName}`}>
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Mid-stay concierge</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Hey {guestName}, happy {stayProgress}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">{vibeLine}</Text>
      </Section>

      {weatherCallout && (
        <Section className="mb-6" style={{ ...cardStyle, background: '#EEF4FF' }}>
          <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9] mb-2">Weather snapshot</Text>
          <Text className="text-sm text-[#1D2939]">{weatherCallout}</Text>
        </Section>
      )}

      {todaysFocus?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Today&apos;s focus
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {todaysFocus.map((item) => (
              <li key={item.label} className="mb-1">
                <span className="font-semibold text-[#1D2939]">{item.label}</span>
                {item.detail ? <> — {item.detail}</> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {housekeepingReminders?.length ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#F8FAFC' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
            Quick reminders
          </Heading>
          <ul className="list-disc pl-5 text-sm text-[#475467]">
            {housekeepingReminders.map((item) => (
              <li key={item} className="mb-1">{item}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {(guestBookUrl || issueReportingUrl) && (
        <Section className="mb-6">
          <Row>
            {guestBookUrl && (
              <Column style={{ width: '50%', minWidth: 240, paddingRight: 8, paddingBottom: 12 }}>
                <a
                  href={guestBookUrl}
                  style={{
                    ...cardStyle,
                    textDecoration: 'none',
                    color: '#101828',
                    display: 'block',
                  }}
                >
                  <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9] mb-2">Plan ahead</Text>
                  <Text className="text-base font-semibold mb-1">Open the guest book</Text>
                  <Text className="text-sm text-[#475467]">Local favorites, scenic drives, and dining holds.</Text>
                </a>
              </Column>
            )}
            {issueReportingUrl && (
              <Column style={{ width: '50%', minWidth: 240, paddingLeft: 8, paddingBottom: 12 }}>
                <a
                  href={issueReportingUrl}
                  style={{
                    ...cardStyle,
                    textDecoration: 'none',
                    color: '#101828',
                    display: 'block',
                  }}
                >
                  <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9] mb-2">Need a hand?</Text>
                  <Text className="text-base font-semibold mb-1">Report an issue</Text>
                  <Text className="text-sm text-[#475467]">Photos welcome. Ops triages in under 10 minutes.</Text>
                </a>
              </Column>
            )}
          </Row>
        </Section>
      )}

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
              {' '}· direct line <a href={`tel:${support.concierge}`} className="text-[#7F56D9]">{support.concierge}</a>
            </>
          ) : null}
          .
        </Text>
        {support.note && <Text className="mt-2 text-sm text-[#475467]">{support.note}</Text>}
      </Section>
    </EmailLayout>
  );
}

export default MidStayCheckInEmail;
