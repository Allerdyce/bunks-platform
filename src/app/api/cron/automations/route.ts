import { claimEmail, completeClaim, releaseClaim } from '@/lib/email/claims';
import { resolveDoorCode } from '@/lib/email/doorCodeDelivery';
import { NextResponse } from 'next/server';
import type { Booking, EmailType, Property } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ensureFeatureEnabled } from '@/lib/featureFlags';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';
import { ensureGuestLeadTable } from '@/lib/guestLeads';
import {
  sendCheckoutReminder,
  sendHostPrepSameDay,
  sendHostPrepThreeDay,
  sendPreStay24hReminder,
  sendPreStayReminder,
  sendReviewRequest,
  sendMidStayCheckIn,
  sendDoorCodeEmail,
  sendReceiptEmail,
  sendBookingConfirmation,
  sendBookingWelcomeEmail,
  sendHostNotification,
} from '@/lib/email';
import { getOpsDetails } from '@/lib/opsDetails';
import { buildHostPrepSameDayOptions, buildHostPrepThreeDayOptions } from '@/lib/email/hostPrepBuilders';
import { PAUSED_EMAIL_TYPES } from '@/lib/email/deliverySettings';

export const runtime = 'nodejs';

// This cron is designed to run ONCE PER DAY (Vercel Hobby only allows daily crons).
// Check-in/check-out dates are stored as UTC midnight of the stay's calendar date, so every job
// is scheduled on a local calendar day relative to the stay rather than on an hour window.
// A job sends when: firstDay <= today <= lastDay (today in the property's timezone), the booking is
// PAID, and no SENT EmailLog exists for (booking, type). Missed days are caught up on the next run
// (within lastDay) and nothing is double-sent.

const DAY_IN_MS = 24 * 60 * 60 * 1000;

type OpsDetailsResult = Awaited<ReturnType<typeof getOpsDetails>>;
type BookingWithProperty = Booking & { property: Property };

type BatchSummary = {
  total: number;
  sent: number;
  skipped: number;
  errors: number;
};

type Anchor = 'checkIn' | 'checkOut';

type DailyJob = {
  key: string;
  type: EmailType;
  anchor: Anchor;
  // Offsets in days from the anchor stay date (negative = before).
  firstDayOffset: number;
  // Last day the job may still send (inclusive), relative to the given anchor.
  lastDay: { anchor: Anchor; offset: number };
  eligible?: (booking: BookingWithProperty) => boolean;
  send: (booking: BookingWithProperty, opsDetails: OpsDetailsResult) => Promise<unknown>;
};

const DAILY_JOBS: DailyJob[] = [
  {
    // Host heads-up three days before arrival (catch up until check-in day).
    key: 'hostPrepThreeDay',
    type: 'HOST_PREP_THREE_DAY',
    anchor: 'checkIn',
    firstDayOffset: -3,
    lastDay: { anchor: 'checkIn', offset: 0 },
    send: (booking, opsDetails) =>
      sendHostPrepThreeDay({ ...buildHostPrepThreeDayOptions(booking, opsDetails), bookingId: booking.id }),
  },
  {
    // Guest pre-stay reminder two days before check-in. Only on that day (or earlier if missed),
    // never on the day before, so it doesn't land alongside the 24h reminder.
    key: 'preStay48h',
    type: 'PRE_STAY_REMINDER',
    anchor: 'checkIn',
    firstDayOffset: -2,
    lastDay: { anchor: 'checkIn', offset: -2 },
    send: (booking) => sendPreStayReminder(booking.id),
  },
  {
    // Guest "see you tomorrow" reminder the day before check-in (catch up on check-in day).
    key: 'preStay24h',
    type: 'PRE_STAY_REMINDER_24H',
    anchor: 'checkIn',
    firstDayOffset: -1,
    lastDay: { anchor: 'checkIn', offset: 0 },
    send: (booking) => sendPreStay24hReminder(booking.id),
  },
  {
    // Door code the day before check-in (catch up while the stay is in progress).
    key: 'doorCodeDelivery',
    type: 'DOOR_CODE_DELIVERY',
    anchor: 'checkIn',
    firstDayOffset: -1,
    lastDay: { anchor: 'checkOut', offset: -1 },
    eligible: (booking) => Boolean(resolveDoorCode(booking.property)),
    send: async (booking) => {
      const code = resolveDoorCode(booking.property);
      if (!code) return null;
      return sendDoorCodeEmail(booking.id, { doorCode: code });
    },
  },
  {
    // Host same-day prep on the morning of check-in.
    key: 'hostPrepSameDay',
    type: 'HOST_PREP_SAME_DAY',
    anchor: 'checkIn',
    firstDayOffset: 0,
    lastDay: { anchor: 'checkIn', offset: 0 },
    send: (booking, opsDetails) =>
      sendHostPrepSameDay({ ...buildHostPrepSameDayOptions(booking, opsDetails), bookingId: booking.id }),
  },
  {
    // Mid-stay check-in the morning after arrival; skipped for 1-night stays (that day is checkout).
    key: 'midStayCheckIn',
    type: 'MID_STAY_CONCIERGE',
    anchor: 'checkIn',
    firstDayOffset: 1,
    lastDay: { anchor: 'checkOut', offset: -1 },
    send: (booking) => sendMidStayCheckIn(booking.id),
  },
  {
    // Checkout reminder the day before checkout (catch up on checkout morning).
    key: 'checkout',
    type: 'CHECKOUT_REMINDER',
    anchor: 'checkOut',
    firstDayOffset: -1,
    lastDay: { anchor: 'checkOut', offset: 0 },
    send: (booking) => sendCheckoutReminder(booking.id),
  },
  {
    // Review request the day after checkout (catch up for a few days).
    key: 'reviewRequests',
    type: 'REVIEW_REQUEST',
    anchor: 'checkOut',
    firstDayOffset: 1,
    lastDay: { anchor: 'checkOut', offset: 4 },
    send: (booking) => sendReviewRequest(booking.id),
  },
];

export async function GET(request: Request) {
  return runAutomations(request);
}

export async function POST(request: Request) {
  return runAutomations(request);
}

async function runAutomations(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureFeatureEnabled('automatedEmails');
  } catch {
    return NextResponse.json({ ok: false, skipped: 'automatedEmails disabled' }, { status: 202 });
  }

  const now = new Date();
  const opsDetails = await getOpsDetails();

  // Load every PAID booking that any job could still act on: arriving within the next few days,
  // currently staying, or checked out within the review window.
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      checkInDate: { lte: new Date(now.getTime() + 5 * DAY_IN_MS) },
      checkOutDate: { gte: new Date(now.getTime() - 6 * DAY_IN_MS) },
    },
    include: { property: true },
    orderBy: { checkInDate: 'asc' },
  });

  const summary: Record<string, BatchSummary> = {};
  for (const job of DAILY_JOBS.filter((entry) => !PAUSED_EMAIL_TYPES.has(entry.type))) {
    summary[job.key] = await runDailyJob(job, bookings, now, opsDetails);
  }
  summary.confirmationCatchUp = await catchUpConfirmationEmails(now);
  summary.wifiBookDirect = await handleWiFiBookDirect(now);

  return NextResponse.json({ ok: true, ranAt: now.toISOString(), summary });
}

async function runDailyJob(
  job: DailyJob,
  bookings: BookingWithProperty[],
  now: Date,
  opsDetails: OpsDetailsResult,
): Promise<BatchSummary> {
  const due = bookings.filter((booking) => {
    if (job.eligible && !job.eligible(booking)) {
      return false;
    }
    const today = localDayNumber(now, resolvePropertyTimeZone(booking.property));
    const firstDay = stayDayNumber(anchorDate(booking, job.anchor)) + job.firstDayOffset;
    const lastDay = stayDayNumber(anchorDate(booking, job.lastDay.anchor)) + job.lastDay.offset;
    return firstDay <= today && today <= lastDay;
  });

  const summary: BatchSummary = { total: due.length, sent: 0, skipped: 0, errors: 0 };
  if (due.length === 0) {
    return summary;
  }

  const alreadySent = await fetchSentMap(job.type, due.map((booking) => booking.id));

  for (const booking of due) {
    if (alreadySent.has(booking.id)) {
      summary.skipped += 1;
      continue;
    }

    // Claim first so an overlapping run (retry, manual trigger) can't send it twice.
    const target = { type: job.type, to: booking.guestEmail, bookingId: booking.id };
    const claimId = await claimEmail(target);
    if (claimId === null) {
      summary.skipped += 1;
      continue;
    }

    try {
      const result = await job.send(booking, opsDetails);
      if (result === null || result === undefined) {
        // Nothing sent (e.g. no door code yet): release so a later run can send it.
        await releaseClaim(claimId);
        summary.skipped += 1;
        continue;
      }
      await completeClaim(claimId, target);
      summary.sent += 1;
    } catch (error) {
      await releaseClaim(claimId);
      summary.errors += 1;
      console.error(`[cron][${job.type}] Failed to send automation`, { bookingId: booking.id, error });
    }
  }

  return summary;
}

function anchorDate(booking: Booking, anchor: Anchor) {
  return anchor === 'checkIn' ? booking.checkInDate : booking.checkOutDate;
}

// Property.timezone defaults to "Europe/London" in the schema, which is wrong for every listing.
function resolvePropertyTimeZone(property: Pick<Property, 'timezone' | 'slug'>) {
  const tz = property.timezone?.trim();
  if (tz && tz !== 'Europe/London' && isValidTimeZone(tz)) {
    return tz;
  }
  const slug = property.slug.toLowerCase();
  if (slug.startsWith('summerland')) {
    return 'America/Los_Angeles';
  }
  return 'America/Denver';
}

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

// Stay dates are stored as UTC midnight of the calendar date → day number from the UTC date parts.
function stayDayNumber(date: Date) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_IN_MS);
}

// "Today" as a calendar day in the given timezone, on the same day-number scale as stayDayNumber.
function localDayNumber(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Math.floor(Date.UTC(get('year'), get('month') - 1, get('day')) / DAY_IN_MS);
}

async function fetchSentMap(type: EmailType, bookingIds: number[]) {
  if (!bookingIds.length) {
    return new Set<number>();
  }

  const logs = await prisma.emailLog.findMany({
    where: {
      type,
      status: 'SENT',
      bookingId: { in: bookingIds },
    },
    select: { bookingId: true },
  });

  return new Set(logs.map((log) => log.bookingId ?? 0));
}

// Booking emails are sent by the Stripe webhook. If that send failed (email provider down,
// function timeout), Stripe's retry sees the booking already PAID and won't resend, so catch
// them up here for recent bookings. Skip the last hour so we never race an in-flight webhook.
const CONFIRMATION_EMAILS: Array<{ type: EmailType; send: (bookingId: number) => Promise<unknown> }> = [
  { type: 'RECEIPT', send: (id) => sendReceiptEmail(id) },
  { type: 'BOOKING_CONFIRMATION', send: (id) => sendBookingConfirmation(id) },
  { type: 'BOOKING_WELCOME', send: (id) => sendBookingWelcomeEmail(id) },
  { type: 'HOST_NOTIFICATION', send: (id) => sendHostNotification(id) },
];

async function catchUpConfirmationEmails(now: Date): Promise<BatchSummary> {
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      createdAt: { gte: new Date(now.getTime() - 7 * DAY_IN_MS), lte: new Date(now.getTime() - 60 * 60_000) },
      checkOutDate: { gte: now },
    },
    select: { id: true, guestEmail: true },
  });
  const summary: BatchSummary = { total: 0, sent: 0, skipped: 0, errors: 0 };
  for (const booking of bookings) {
    for (const email of CONFIRMATION_EMAILS) {
      const target = { type: email.type, to: booking.guestEmail, bookingId: booking.id };
      const claimId = await claimEmail(target);
      if (claimId === null) continue; // already sent
      summary.total += 1;
      try {
        const result = await email.send(booking.id);
        if (result === null || result === undefined) {
          await releaseClaim(claimId);
          summary.skipped += 1;
          continue;
        }
        await completeClaim(claimId, target);
        summary.sent += 1;
      } catch (error) {
        await releaseClaim(claimId);
        summary.errors += 1;
        console.error(`[cron][catch-up] Failed to send ${email.type}`, { bookingId: booking.id, error });
      }
    }
  }
  return summary;
}

const WIFI_CAMPAIGN_DELAY_DAYS = 14;
const WIFI_CAMPAIGN_MAX_AGE_DAYS = 60;
const LEGACY_WIFI_USER_NAME = 'WiFi Guest';

async function handleWiFiBookDirect(now: Date): Promise<BatchSummary> {
  // Target: Wi-Fi captured guests created 14–60 days ago who haven't received the campaign yet
  // and haven't booked direct since. Running daily with a range means missed days catch up.
  const newest = new Date(now.getTime() - WIFI_CAMPAIGN_DELAY_DAYS * DAY_IN_MS);
  const oldest = new Date(now.getTime() - WIFI_CAMPAIGN_MAX_AGE_DAYS * DAY_IN_MS);

  const users = await prisma.user.findMany({
    where: {
      role: 'GUEST',
      createdAt: { gte: oldest, lte: newest },
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (users.length === 0) {
    return { total: 0, sent: 0, skipped: 0, errors: 0 };
  }

  // Only guests who came from the Wi-Fi capture page.
  let leadEmails = new Set<string>();
  try {
    await ensureGuestLeadTable();
    const leads = await prisma.guestLead.findMany({
      where: { email: { in: users.map((user) => user.email) } },
      select: { email: true },
    });
    leadEmails = new Set(leads.map((lead) => lead.email.toLowerCase()));
  } catch (error) {
    console.error('[cron][wifi-campaign] Failed to read guest leads', error);
  }

  const candidates = users.filter(
    (user) => user.name === LEGACY_WIFI_USER_NAME || leadEmails.has(user.email.toLowerCase()),
  );

  const summary: BatchSummary = { total: candidates.length, sent: 0, skipped: 0, errors: 0 };

  if (candidates.length === 0) {
    return summary;
  }

  const candidateEmails = candidates.map((c) => c.email);

  // Deduplication by (type + to:email), since Wi-Fi leads have no bookingId.
  const alreadySentLogs = await prisma.emailLog.findMany({
    where: {
      type: 'CAMPAIGN_BOOK_DIRECT_WIFI',
      status: 'SENT',
      to: { in: candidateEmails },
    },
    select: { to: true },
  });
  const sentSet = new Set(alreadySentLogs.map((l) => l.to.toLowerCase()));

  // Skip guests who already booked direct after we captured them.
  const paidBookings = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      guestEmail: { in: candidateEmails, mode: 'insensitive' },
      createdAt: { gte: oldest },
    },
    select: { guestEmail: true, createdAt: true },
  });

  const { sendWifiLeadCampaign } = await import('@/lib/email/sendWifiLeadCampaign');

  for (const user of candidates) {
    const email = user.email.toLowerCase();
    const bookedSinceCapture = paidBookings.some(
      (booking) => booking.guestEmail.toLowerCase() === email && booking.createdAt >= user.createdAt,
    );

    if (sentSet.has(email) || bookedSinceCapture) {
      summary.skipped += 1;
      continue;
    }

    const target = { type: 'CAMPAIGN_BOOK_DIRECT_WIFI' as const, to: user.email };
    const claimId = await claimEmail(target);
    if (claimId === null) {
      summary.skipped += 1;
      continue;
    }

    try {
      await sendWifiLeadCampaign({
        email: user.email,
        name: user.name && user.name !== LEGACY_WIFI_USER_NAME ? user.name : undefined,
      });
      await completeClaim(claimId, target);
      summary.sent += 1;
    } catch (error) {
      await releaseClaim(claimId);
      summary.errors += 1;
      console.error('[cron][wifi-campaign] Failed to send', { email: user.email, error });
    }
  }

  return summary;
}
