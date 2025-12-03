import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

function normalizeHref(href?: string | null) {
  if (!href) {
    return null;
  }

  try {
    const parsed = new URL(href);
    parsed.hash = '';
    const normalized = parsed.toString();
    return normalized.endsWith('/') && normalized.length > 1 ? normalized.slice(0, -1) : normalized;
  } catch {
    const withoutHash = href.split('#')[0] ?? href;
    return withoutHash.replace(/\/+/g, '/').replace(/\/$/, '') || withoutHash;
  }
}

function appendAnchor(href: string, anchor: string) {
  const base = href.split('#')[0] ?? href;
  return `${base}#${anchor}`;
}

export interface PreStayReminderEmailProps {
  guestName: string;
  propertyName: string;
  checkInDate: string;
  weatherSummary?: string;
  packingList?: string[];
  checkInGuideUrl?: string;
  guestBookUrl?: string;
  hostSupportEmail?: string;
  supportPhone?: string;
  essentials?: { label: string; detail: string; helper?: string }[];
  parkingNote?: string;
  quietHours?: string;
  emergencyContacts?: { label: string; detail: string; helper?: string }[];
}

export function PreStayReminderEmail(props: PreStayReminderEmailProps) {
  const {
    guestName,
    propertyName,
    checkInDate,
    weatherSummary,
    packingList = [],
    checkInGuideUrl,
    guestBookUrl,
    hostSupportEmail,
    supportPhone,
    essentials,
    parkingNote,
    quietHours,
    emergencyContacts,
  } = props;

  const normalizedCheckInGuide = normalizeHref(checkInGuideUrl);
  const normalizedGuestBook = normalizeHref(guestBookUrl);
  const shouldCombineGuides = Boolean(
    normalizedCheckInGuide && normalizedGuestBook && normalizedCheckInGuide === normalizedGuestBook,
  );
  const combinedGuideUrl = checkInGuideUrl ?? guestBookUrl;
  const recommendationsAnchor = guestBookUrl ? appendAnchor(guestBookUrl, 'recommendations') : null;

  return (
    <EmailLayout previewText={`You&apos;re almost at ${propertyName}`}> 
      <Heading className="mb-2 text-2xl font-semibold">48 hours to go 🎒</Heading>
      <Text className="text-base text-[#475467]">
        Hey {guestName}, we&apos;re counting down to your stay at {propertyName}. Here&apos;s a quick refresher so arrival on {checkInDate} stays effortless.
      </Text>

      {weatherSummary && (
        <Section className="mt-6 rounded-xl bg-[#EEF2FF] p-4">
          <Heading as="h3" className="text-lg font-semibold text-[#4338CA]">
            Weather snapshot
          </Heading>
          <Text className="text-sm text-[#3730A3]">{weatherSummary}</Text>
        </Section>
      )}

      {shouldCombineGuides && combinedGuideUrl ? (
        <Section className="mt-6">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Everything lives in one guide
          </Heading>
          <Text className="text-sm text-[#475467]">
            Door codes, parking, Wi-Fi, and our curated recommendations are all in the same spot.
          </Text>
          <Button
            className="mt-3 inline-flex rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
            href={combinedGuideUrl}
          >
            Open stay guide
          </Button>
          {recommendationsAnchor && (
            <Text className="text-xs text-[#475467] mt-2">
              Want the highlights? Jump straight to <a href={recommendationsAnchor} className="text-[#7F56D9]">recommendations</a>.
            </Text>
          )}
        </Section>
      ) : null}

      {!shouldCombineGuides && checkInGuideUrl && (
        <Section className="mt-6">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Door codes & arrival notes
          </Heading>
          <Text className="text-sm text-[#475467]">
            Parking, smart lock, Wi-Fi, and arrival checklist live here.
          </Text>
          <Button
            className="mt-3 inline-flex rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
            href={checkInGuideUrl}
          >
            Open updated instructions
          </Button>
        </Section>
      )}

      {!shouldCombineGuides && guestBookUrl && (
        <Section className="mt-6 rounded-xl border border-[#EAECF0] p-4">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Guest Book refresh
          </Heading>
          <Text className="text-sm text-[#475467]">
            Trails, bites, morning coffee, and sunset decks curated for this stay.
          </Text>
          <Button
            className="mt-3 inline-flex rounded-lg bg-[#574BFF] px-4 py-2 text-sm font-semibold text-white"
            href={guestBookUrl}
          >
            Browse recommendations
          </Button>
        </Section>
      )}

      {essentials?.length ? (
        <Section className="mt-6 rounded-xl border border-[#EAECF0] p-4">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Codes & essentials
          </Heading>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {essentials.map((item) => (
              <div key={item.label} className="rounded-lg bg-[#F8F9FC] p-3">
                <p className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">{item.label}</p>
                <p className="text-base font-semibold text-[#101828] mt-1">{item.detail}</p>
                {item.helper && <p className="text-sm text-[#475467] mt-1">{item.helper}</p>}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {(parkingNote || quietHours) && (
        <Section className="mt-6 rounded-xl border border-[#EAECF0] p-4 bg-[#F8F9FC]">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Property rhythm
          </Heading>
          {parkingNote && <Text className="text-sm text-[#475467] mt-2">{parkingNote}</Text>}
          {quietHours && (
            <Text className="text-sm text-[#475467] mt-2">Quiet hours: {quietHours}</Text>
          )}
        </Section>
      )}

      {emergencyContacts?.length ? (
        <Section className="mt-6 rounded-xl border border-[#EAECF0] p-4">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Quick emergency references
          </Heading>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {emergencyContacts.map((contact) => (
              <div key={`${contact.label}-${contact.detail}`} className="rounded-lg border border-[#E4E7EC] p-3">
                <p className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">{contact.label}</p>
                <p className="text-base font-semibold text-[#101828] mt-1">{contact.detail}</p>
                {contact.helper && <p className="text-sm text-[#475467] mt-1">{contact.helper}</p>}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {packingList.length > 0 && (
        <Section className="mt-6">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            What to pack
          </Heading>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#475467]">
            {packingList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      <Hr className="my-6 border-[#EAECF0]" />

      <Section>
        <Heading as="h3" className="text-lg font-semibold text-[#111827]">
          Text or email us anytime
        </Heading>
        <Text className="text-sm text-[#475467]">
          {hostSupportEmail ?? 'hello@bunks.com'}
          {supportPhone ? ` · ${supportPhone}` : ''}
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default PreStayReminderEmail;
