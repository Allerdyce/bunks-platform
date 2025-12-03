import * as React from 'react';
import { Column, Heading, Img, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface MemoryHighlight {
  title: string;
  detail: string;
  note?: string;
}

export interface UpcomingReason {
  title: string;
  date: string;
  description: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface OfferBlock {
  headline: string;
  description: string;
  code: string;
  expiresOn: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface ReferralBlock {
  headline: string;
  reward: string;
  detail: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface HostSignature {
  name: string;
  title?: string;
  headshotUrl?: string;
}

export interface PostStayThankYouEmailProps {
  guestName: string;
  propertyName: string;
  stayDates: string;
  heroCopy?: string;
  memoryHighlights?: MemoryHighlight[];
  futureStayOffer?: OfferBlock;
  referral?: ReferralBlock;
  upcomingReasons?: UpcomingReason[];
  housekeepingFollowUp?: string[];
  photoGalleryUrl?: string;
  reviewUrl?: string;
  support: {
    email: string;
    phone?: string;
    concierge?: string;
    note?: string;
  };
  hostSignature?: HostSignature;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 18,
  padding: '20px 22px',
  background: '#FFFFFF',
};

const pillStyle: React.CSSProperties = {
  borderRadius: 999,
  border: '1px solid #E4E7EC',
  background: '#F4F3FF',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#7F56D9',
  display: 'inline-flex',
  alignItems: 'center',
};

export function PostStayThankYouEmail(props: PostStayThankYouEmailProps) {
  const {
    guestName,
    propertyName,
    stayDates,
    heroCopy = 'Can’t wait to welcome you back. Let us know when you’re ready for round two.',
    memoryHighlights,
    futureStayOffer,
    referral,
    upcomingReasons,
    housekeepingFollowUp,
    photoGalleryUrl,
    reviewUrl,
    support,
    hostSignature,
  } = props;

  return (
    <EmailLayout previewText={`Thanks for staying at ${propertyName}`}> 
      <Section className="mb-6">
        <Text className="text-sm uppercase tracking-[0.35em] text-[#7F56D9]">Thank you</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          {guestName}, thanks for choosing {propertyName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">Stay dates · {stayDates}</Text>
        <Text className="mt-3 text-base text-[#101828]">{heroCopy}</Text>
      </Section>

      {memoryHighlights?.length ? (
        <Section className="mb-6" style={cardStyle}>
          <Heading as="h2" className="text-xl font-semibold text-[#101828] mb-3">
            Highlights we loved hearing about
          </Heading>
          <div className="space-y-3">
            {memoryHighlights.map((highlight) => (
              <div key={highlight.title}>
                <Text className="text-sm uppercase tracking-[0.3em] text-[#98A2B3]">{highlight.title}</Text>
                <Text className="text-base text-[#101828] mt-1">{highlight.detail}</Text>
                {highlight.note && <Text className="text-sm text-[#475467] mt-1">{highlight.note}</Text>}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {(futureStayOffer || referral) && (
        <Section className="mb-6">
          <Row>
            {futureStayOffer && (
              <Column style={{ width: '50%', minWidth: 240, paddingRight: 8, paddingBottom: 12 }}>
                <div style={cardStyle}>
                  <span style={pillStyle}>Return guest perk</span>
                  <Heading as="h3" className="text-lg font-semibold text-[#101828] mt-3">
                    {futureStayOffer.headline}
                  </Heading>
                  <Text className="text-sm text-[#475467] mt-2">{futureStayOffer.description}</Text>
                  <Text className="mt-3 text-base font-semibold text-[#101828]">
                    Code: <code style={{ background: '#F4F3FF', padding: '2px 8px', borderRadius: 6 }}>{futureStayOffer.code}</code>
                  </Text>
                  <Text className="text-sm text-[#475467] mt-1">Expires {futureStayOffer.expiresOn}</Text>
                  <a
                    href={futureStayOffer.ctaUrl}
                    style={{ display: 'inline-flex', marginTop: 14, color: '#7F56D9', fontWeight: 600 }}
                  >
                    {futureStayOffer.ctaLabel} →
                  </a>
                </div>
              </Column>
            )}
            {referral && (
              <Column style={{ width: '50%', minWidth: 240, paddingLeft: 8, paddingBottom: 12 }}>
                <div style={{ ...cardStyle, background: '#F8F5FF' }}>
                  <span style={{ ...pillStyle, background: '#FFF2EB', borderColor: '#FAD8C5', color: '#C4320A' }}>Share the stay</span>
                  <Heading as="h3" className="text-lg font-semibold text-[#101828] mt-3">
                    {referral.headline}
                  </Heading>
                  <Text className="text-base font-semibold text-[#101828] mt-2">Reward: {referral.reward}</Text>
                  <Text className="text-sm text-[#475467] mt-1">{referral.detail}</Text>
                  <a
                    href={referral.ctaUrl}
                    style={{ display: 'inline-flex', marginTop: 14, color: '#C4320A', fontWeight: 600 }}
                  >
                    {referral.ctaLabel} →
                  </a>
                </div>
              </Column>
            )}
          </Row>
        </Section>
      )}

      {upcomingReasons?.length ? (
        <Section className="mb-6" style={{ ...cardStyle, background: '#F8F9FC' }}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-3">
            Reasons to come back soon
          </Heading>
          <div className="space-y-3">
            {upcomingReasons.map((event) => (
              <div key={event.title} style={{ borderBottom: '1px solid #EAECF0', paddingBottom: 14 }}>
                <Text className="text-sm uppercase tracking-[0.3em] text-[#98A2B3]">{event.date}</Text>
                <Text className="text-base font-semibold text-[#101828] mt-1">{event.title}</Text>
                <Text className="text-sm text-[#475467] mt-1">{event.description}</Text>
                {event.ctaLabel && event.ctaUrl && (
                  <a href={event.ctaUrl} style={{ display: 'inline-flex', marginTop: 10, color: '#7F56D9', fontWeight: 600 }}>
                    {event.ctaLabel} →
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {(housekeepingFollowUp?.length || photoGalleryUrl || reviewUrl) && (
        <Section className="mb-6">
          <Row>
            {housekeepingFollowUp?.length ? (
              <Column style={{ width: '50%', minWidth: 240, paddingRight: 8, paddingBottom: 12 }}>
                <div style={cardStyle}>
                  <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9] mb-2">Quick follow-up</Text>
                  <ul className="list-disc pl-5 text-sm text-[#475467]">
                    {housekeepingFollowUp.map((item) => (
                      <li key={item} className="mb-1">{item}</li>
                    ))}
                  </ul>
                </div>
              </Column>
            ) : null}
            {(photoGalleryUrl || reviewUrl) && (
              <Column style={{ width: '50%', minWidth: 240, paddingLeft: 8, paddingBottom: 12 }}>
                <div style={cardStyle}>
                  <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9] mb-2">Stay keepsakes</Text>
                  {photoGalleryUrl && (
                    <a href={photoGalleryUrl} style={{ display: 'block', color: '#101828', textDecoration: 'none' }}>
                      <Text className="text-base font-semibold mb-1">Download gallery</Text>
                      <Text className="text-sm text-[#475467]">Full-res photos from your stay.</Text>
                    </a>
                  )}
                  {reviewUrl && (
                    <a href={reviewUrl} style={{ display: 'block', marginTop: 14, color: '#101828', textDecoration: 'none' }}>
                      <Text className="text-base font-semibold mb-1">Share feedback</Text>
                      <Text className="text-sm text-[#475467]">30 seconds to help future guests.</Text>
                    </a>
                  )}
                </div>
              </Column>
            )}
          </Row>
        </Section>
      )}

      <Section className="rounded-3xl border border-[#EAECF0] bg-[#F8F9FC] p-5">
        <Heading as="h3" className="text-lg font-semibold text-[#101828] mb-2">
          Stay in touch
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
        {support.note && <Text className="mt-2 text-sm text-[#475467]">{support.note}</Text>}
      </Section>

      {hostSignature && (
        <Section className="flex items-center gap-4 mt-6">
          {hostSignature.headshotUrl && (
            <Img
              src={hostSignature.headshotUrl}
              alt={hostSignature.name}
              width={48}
              height={48}
              style={{ borderRadius: '9999px', objectFit: 'cover' }}
            />
          )}
          <div>
            <Text className="text-base font-semibold text-[#101828]">{hostSignature.name}</Text>
            {hostSignature.title && <Text className="text-sm text-[#475467]">{hostSignature.title}</Text>}
          </div>
        </Section>
      )}
    </EmailLayout>
  );
}

export default PostStayThankYouEmail;
