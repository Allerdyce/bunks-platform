import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { PostStayThankYouEmail } from '@/emails/PostStayThankYouEmail';
import type {
  MemoryHighlight,
  OfferBlock,
  ReferralBlock,
  UpcomingReason,
  PostStayThankYouEmailProps,
  HostSignature,
} from '@/emails/PostStayThankYouEmail';
import {
  formatStayDates,
  logEmailSend,
  renderEmail,
  resolveHostSupportEmail,
  sendEmail,
} from '@/lib/email';

const EMAIL_TYPE = 'POST_STAY_THANK_YOU' as const;

function defaultHighlights(propertyName: string): MemoryHighlight[] {
  return [
    {
      title: 'Moments that mattered',
      detail: `Thanks for letting us host your crew at ${propertyName}. Ops loved hearing about the sunset hot tub sessions.`,
    },
    {
      title: 'Chef-prepped dinner',
      detail: 'We passed kudos along to the culinary team—they had a blast.',
    },
  ];
}

function defaultOffer(): OfferBlock {
  return {
    headline: 'Come back within 6 months',
    description: 'Save 10% on your next booking at any Bunks property.',
    code: 'RETURN10',
    expiresOn: '6 months from today',
    ctaLabel: 'Browse properties',
    ctaUrl: 'https://bunks.com/properties',
  };
}

function defaultReferral(): ReferralBlock {
  return {
    headline: 'Share the stay credits',
    reward: '$200 travel credit for you + your friend',
    detail: 'Send them your personal link—credit applied automatically.',
    ctaLabel: 'Copy referral link',
    ctaUrl: 'https://bunks.com/referrals',
  };
}

function defaultUpcomingReasons(propertyName: string): UpcomingReason[] {
  return [
    {
      title: 'Peak wildflower week',
      date: 'Late July',
      description: `Hike the ridge behind ${propertyName} and soak in the springs after.`,
      ctaLabel: 'Hold dates',
      ctaUrl: 'https://bunks.com/trips/wildflowers',
    },
  ];
}

async function alreadySent(bookingId: number) {
  const log = await prisma.emailLog.findFirst({
    where: { bookingId, type: EMAIL_TYPE, status: 'SENT' },
  });
  return Boolean(log);
}

type PostStayThankYouOptions = {
  heroCopy?: string;
  memoryHighlights?: MemoryHighlight[];
  futureStayOffer?: OfferBlock;
  referral?: ReferralBlock;
  upcomingReasons?: UpcomingReason[];
  housekeepingFollowUp?: string[];
  photoGalleryUrl?: string;
  reviewUrl?: string;
  supportOverrides?: Partial<PostStayThankYouEmailProps['support']>;
  hostSignature?: HostSignature;
  toOverride?: string;
  subjectOverride?: string;
  replyToOverride?: string;
  force?: boolean;
};

export async function sendPostStayThankYou(bookingId: number, options: PostStayThankYouOptions = {}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (!options.force) {
    const sent = await alreadySent(booking.id);
    if (sent) {
      return null;
    }
  }

  const stayDates = formatStayDates(new Date(booking.checkInDate), new Date(booking.checkOutDate));
  const support = {
    email: options.supportOverrides?.email ?? resolveHostSupportEmail(booking),
    phone: options.supportOverrides?.phone,
    concierge: options.supportOverrides?.concierge,
    note: options.supportOverrides?.note,
  } satisfies PostStayThankYouEmailProps['support'];

  const html = await renderEmail(
    <PostStayThankYouEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      stayDates={stayDates}
      heroCopy={options.heroCopy}
      memoryHighlights={[]} // Removed hardcoded fake highlights
      futureStayOffer={undefined} // Removed invalid coupon code
      referral={undefined} // Removed broken referral link
      upcomingReasons={[]} // Removed generic reasons
      housekeepingFollowUp={options.housekeepingFollowUp}
      photoGalleryUrl={options.photoGalleryUrl}
      reviewUrl={options.reviewUrl}
      support={support}
      hostSignature={options.hostSignature}
    />,
  );

  const to = options.toOverride ?? booking.guestEmail;
  const subject = options.subjectOverride ?? `Thank you for staying at ${booking.property.name}`;
  const replyTo = options.replyToOverride ?? support.email;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      bookingId: booking.id,
      to,
      type: EMAIL_TYPE,
      status,
      error: error ? String((error as Error)?.message ?? error) : undefined,
    });
  };

  try {
    const response = await sendEmail({
      to,
      subject,
      html,
      replyTo,
    });
    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
