import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

function normalizeHref(href?: string | null) {
  if (!href) return null;
  try {
    const parsed = new URL(href);
    parsed.hash = '';
    const normalized = parsed.toString();
    return normalized.endsWith('/') && normalized.length > 1 ? normalized.slice(0, -1) : normalized;
  } catch {
    const base = href.split('#')[0] ?? href;
    return base.replace(/\/{2,}/g, '/').replace(/\/$/, '') || base;
  }
}

function appendAnchor(href: string, anchor: string) {
  const base = href.split('#')[0] ?? href;
  return `${base}#${anchor}`;
}

export interface BookingConfirmationEmailProps {
  guestName: string;
  propertyName: string;
  propertyLocation?: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalPaid: string;
  checkInGuideUrl?: string;
  guestBookUrl?: string;
  hostSupportEmail?: string;
  hostPhoneNumber?: string;
  mapUrl?: string;
  arrivalNotes?: string;
  directions?: { label: string; detail: string }[];
  essentials?: { label: string; detail: string; helper?: string }[];
}

export function BookingConfirmationEmail(props: BookingConfirmationEmailProps) {
  const {
    guestName,
    propertyName,
    propertyLocation,
    checkInDate,
    checkOutDate,
    nights,
    totalPaid,
    checkInGuideUrl,
    guestBookUrl,
    hostSupportEmail,
    hostPhoneNumber,
    mapUrl,
    arrivalNotes,
    directions,
    essentials,
  } = props;

  const normalizedCheckInGuide = normalizeHref(checkInGuideUrl);
  const normalizedGuestBook = normalizeHref(guestBookUrl);
  const shareGuide = Boolean(
    normalizedCheckInGuide && normalizedGuestBook && normalizedCheckInGuide === normalizedGuestBook,
  );
  const combinedGuideUrl = checkInGuideUrl ?? guestBookUrl;
  const recommendationsAnchor = guestBookUrl ? appendAnchor(guestBookUrl, 'recommendations') : null;

  return (
    <EmailLayout previewText={`You&apos;re confirmed for ${propertyName}!`}>
      <Heading className="mb-2 text-2xl font-semibold">You&apos;re all set, {guestName}</Heading>
      <Text className="text-base text-[#475467]">
        Thanks for booking with Bunks. Your stay at <strong>{propertyName}</strong>
        {propertyLocation ? ` in ${propertyLocation}` : ''} is confirmed. Here&apos;s
        everything you need before you arrive.
      </Text>

      <Section className="mt-6 rounded-xl bg-[#F4F7FE] p-4 text-sm text-[#1D2939]">
        <Text className="font-semibold text-[#111827]">Stay details</Text>
        <Text className="mt-2">
          <strong>Check-in:</strong> {checkInDate}
          <br />
          <strong>Check-out:</strong> {checkOutDate}
          <br />
          <strong>Nights:</strong> {nights}
          <br />
          <strong>Total paid:</strong> {totalPaid}
        </Text>
        {mapUrl && (
          <Button
            className="mt-4 inline-flex rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
            href={mapUrl}
          >
            View map + directions
          </Button>
        )}
      </Section>

      {shareGuide && combinedGuideUrl ? (
        <Section className="mt-6">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Live instructions & guest book
          </Heading>
          <Text className="text-sm text-[#475467]">
            Door codes, parking tips, Wi-Fi, and our curated neighborhood picks now live in one guide.
          </Text>
          <Button
            className="mt-3 inline-flex rounded-lg bg-[#574BFF] px-4 py-2 text-sm font-semibold text-white"
            href={combinedGuideUrl}
          >
            Open stay guide
          </Button>
          {recommendationsAnchor && (
            <Text className="text-xs text-[#475467] mt-2">
              Need inspo fast? Jump to <a href={recommendationsAnchor} className="text-[#7F56D9]">recommendations</a>.
            </Text>
          )}
        </Section>
      ) : null}

      {!shareGuide && checkInGuideUrl && (
        <Section className="mt-6">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Check-in instructions
          </Heading>
          <Text className="text-sm text-[#475467]">
            Everything you need for smooth arrival—door codes, parking, and tips.
          </Text>
          <Button
            className="mt-3 inline-flex rounded-lg bg-[#574BFF] px-4 py-2 text-sm font-semibold text-white"
            href={checkInGuideUrl}
          >
            Open check-in guide
          </Button>
        </Section>
      )}

      {!shareGuide && guestBookUrl && (
        <Section className="mt-6">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Guest Book
          </Heading>
          <Text className="text-sm text-[#475467]">
            Explore the neighborhood, chef recommendations, trails, and hidden gems curated by the Bunks team.
          </Text>
          <Button
            className="mt-3 inline-flex rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
            href={guestBookUrl}
          >
            Launch guest book
          </Button>
        </Section>
      )}

      {essentials?.length ? (
        <Section className="mt-6 rounded-xl border border-[#EAECF0] p-4 bg-[#F8F9FC]">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Arrival essentials
          </Heading>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {essentials.map((item) => (
              <div key={item.label} className="rounded-lg border border-[#E4E7EC] bg-white p-3">
                <p className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">{item.label}</p>
                <p className="text-base font-semibold text-[#101828] mt-1">{item.detail}</p>
                {item.helper && <p className="text-sm text-[#475467] mt-1">{item.helper}</p>}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {(arrivalNotes || directions?.length) && (
        <Section className="mt-6 rounded-xl border border-[#EAECF0] p-4">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Getting there
          </Heading>
          {arrivalNotes && <Text className="text-sm text-[#475467] mt-2">{arrivalNotes}</Text>}
          {directions?.length ? (
            <div className="mt-4 space-y-3">
              {directions.map((direction) => (
                <div key={direction.label} className="rounded-lg bg-[#F8F9FC] p-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#98A2B3]">{direction.label}</p>
                  <p className="text-sm text-[#111827] mt-1">{direction.detail}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Section>
      )}

      <Section className="mt-6">
        <Heading as="h3" className="text-lg font-semibold text-[#111827]">
          Need help?
        </Heading>
        <Text className="text-sm text-[#475467]">
          Reach us anytime at {hostSupportEmail ?? 'hello@bunks.com'}
          {hostPhoneNumber ? ` or via SMS at ${hostPhoneNumber}` : ''}.
        </Text>
      </Section>

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs uppercase tracking-wide text-[#98A2B3]">
        We can&apos;t wait to host you.
      </Text>
    </EmailLayout>
  );
}

export default BookingConfirmationEmail;
