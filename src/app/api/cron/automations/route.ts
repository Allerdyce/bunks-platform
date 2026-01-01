import { NextResponse } from 'next/server';
import type { EmailType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ensureFeatureEnabled } from '@/lib/featureFlags';
import {
  sendCheckoutReminder,
  sendHostPrepSameDay,
  sendHostPrepThreeDay,
  sendPreStay24hReminder,
  sendPreStayReminder,
  sendReviewRequest,
  sendMidStayCheckIn,
  sendDoorCodeEmail,
} from '@/lib/email';
import { getOpsDetails } from '@/lib/opsDetails';
import { buildHostPrepSameDayOptions, buildHostPrepThreeDayOptions } from '@/lib/email/hostPrepBuilders';

export const runtime = 'nodejs';

const HOURS_IN_MS = 60 * 60 * 1000;

const PRE_STAY_TOLERANCE_HOURS = 6;
const CHECKOUT_TOLERANCE_HOURS = 6;
const REVIEW_LOOKBACK_HOURS = 96;
const HOST_PREP_THREE_DAY_LEAD = 72;
const HOST_PREP_THREE_DAY_TOLERANCE = 12;
const HOST_PREP_SAME_DAY_LEAD = 12;
const HOST_PREP_SAME_DAY_TOLERANCE = 4;
const CHECKOUT_REMINDER_LEAD = 20;

export async function POST() {
  try {
    await ensureFeatureEnabled('automatedEmails');
  } catch {
    return NextResponse.json({ ok: false, skipped: 'automatedEmails disabled' }, { status: 202 });
  }

  const now = new Date();
  const opsDetails = await getOpsDetails();

  const summary = {
    preStay48h: await handlePreStayReminder({ now, hoursBefore: 48, type: 'PRE_STAY_REMINDER', sender: sendPreStayReminder }),
    preStay24h: await handlePreStayReminder({ now, hoursBefore: 24, type: 'PRE_STAY_REMINDER_24H', sender: sendPreStay24hReminder }),
    checkout: await handleCheckoutReminder(now),
    reviewRequests: await handleReviewRequests(now),
    hostPrepThreeDay: await handleHostPrepThreeDay(now, opsDetails),
    hostPrepSameDay: await handleHostPrepSameDay(now, opsDetails),
    midStayCheckIn: await handleMidStayCheckIn(now),
    doorCodeDelivery: await handleDoorCodeDelivery(now),
    wifiBookDirect: await handleWiFiBookDirect(now),
  };

  return NextResponse.json({ ok: true, ranAt: now.toISOString(), summary });
}

const WIFI_CAMPAIGN_DELAY_DAYS = 14;

async function handleWiFiBookDirect(now: Date): Promise<BatchSummary> {
  // Target: Users created exactly 14 days ago (start to end of that day)
  // We run daily, so we just grab the window for T-14 days.

  // e.g. If today is Dec 20, we want users from Dec 6.
  // Window: Dec 6 00:00:00 to Dec 6 23:59:59.

  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() - WIFI_CAMPAIGN_DELAY_DAYS);

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Find users
  const candidates = await prisma.user.findMany({
    where: {
      role: 'GUEST',
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: { id: true, email: true, name: true },
  });

  const summary: BatchSummary = { total: candidates.length, sent: 0, skipped: 0, errors: 0 };

  if (candidates.length === 0) {
    return summary;
  }

  // Deduplication: Check EmailLog by helper function
  // fetchSentMap uses bookingId, so we check "email" type logs manually here or adapt.
  // Since we don't have bookingIds for wifi leads, we check by (type + to:email).

  const alreadySentLogs = await prisma.emailLog.findMany({
    where: {
      type: 'CAMPAIGN_BOOK_DIRECT_WIFI',
      status: 'SENT',
      to: { in: candidates.map(c => c.email) },
    },
    select: { to: true },
  });

  const sentSet = new Set(alreadySentLogs.map(l => l.to));

  // Import sender dynamically to avoid circular deps if any, or just import at top if fine.
  // Note: We need to update imports at the top of the file separately, but for now assuming we added it.
  const { sendWifiLeadCampaign } = await import('@/lib/email/sendWifiLeadCampaign');

  for (const user of candidates) {
    if (sentSet.has(user.email)) {
      summary.skipped += 1;
      continue;
    }

    try {
      await sendWifiLeadCampaign({ email: user.email, name: user.name || undefined });

      // Log it
      await prisma.emailLog.create({
        data: {
          to: user.email,
          type: 'CAMPAIGN_BOOK_DIRECT_WIFI',
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      summary.sent += 1;
    } catch (error) {
      summary.errors += 1;
      console.error('[cron][wifi-campaign] Failed to send', { email: user.email, error });
    }
  }

  return summary;
}

type BatchSummary = {
  total: number;
  sent: number;
  skipped: number;
  errors: number;
};

type BasicBookingRecord = {
  id: number;
  scheduleDate: Date;
};

type PreStayHandlerConfig = {
  now: Date;
  hoursBefore: number;
  type: EmailType;
  sender: (bookingId: number) => Promise<unknown>;
};

async function handlePreStayReminder(config: PreStayHandlerConfig): Promise<BatchSummary> {
  const { now, hoursBefore, type, sender } = config;
  const upcoming = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      checkInDate: {
        gte: now,
        lte: addHours(now, hoursBefore + PRE_STAY_TOLERANCE_HOURS),
      },
    },
    select: { id: true, checkInDate: true },
    orderBy: { checkInDate: 'asc' },
  });

  const bookings: BasicBookingRecord[] = upcoming.map((booking) => ({
    id: booking.id,
    scheduleDate: booking.checkInDate,
  }));

  return runLeadTimeBatch({
    bookings,
    type,
    sender,
    now,
    leadHours: hoursBefore,
    toleranceHours: PRE_STAY_TOLERANCE_HOURS,
  });
}

async function handleCheckoutReminder(now: Date): Promise<BatchSummary> {
  const upcoming = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      checkOutDate: {
        gte: now,
        lte: addHours(now, CHECKOUT_REMINDER_LEAD + CHECKOUT_TOLERANCE_HOURS),
      },
    },
    select: { id: true, checkOutDate: true },
    orderBy: { checkOutDate: 'asc' },
  });

  const bookings: BasicBookingRecord[] = upcoming.map((booking) => ({
    id: booking.id,
    scheduleDate: booking.checkOutDate,
  }));

  return runLeadTimeBatch({
    bookings,
    type: 'CHECKOUT_REMINDER',
    sender: (bookingId) => sendCheckoutReminder(bookingId),
    now,
    leadHours: CHECKOUT_REMINDER_LEAD,
    toleranceHours: CHECKOUT_TOLERANCE_HOURS,
  });
}

async function handleReviewRequests(now: Date): Promise<BatchSummary> {
  const recent = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      checkOutDate: {
        gte: addHours(now, -REVIEW_LOOKBACK_HOURS),
        lte: addHours(now, -24),
      },
    },
    select: { id: true, checkOutDate: true },
    orderBy: { checkOutDate: 'asc' },
  });

  const alreadySent = await fetchSentMap('REVIEW_REQUEST', recent.map((booking) => booking.id));

  const summary: BatchSummary = { total: recent.length, sent: 0, skipped: 0, errors: 0 };

  for (const booking of recent) {
    if (alreadySent.has(booking.id)) {
      summary.skipped += 1;
      continue;
    }

    try {
      await sendReviewRequest(booking.id);
      summary.sent += 1;
    } catch (error) {
      summary.errors += 1;
      console.error('[cron][review] Failed to send review request', { bookingId: booking.id, error });
    }
  }

  return summary;
}

async function handleHostPrepThreeDay(now: Date, opsDetails: Awaited<ReturnType<typeof getOpsDetails>>): Promise<BatchSummary> {
  const upcoming = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      checkInDate: {
        gte: now,
        lte: addHours(now, HOST_PREP_THREE_DAY_LEAD + HOST_PREP_THREE_DAY_TOLERANCE),
      },
    },
    include: { property: true },
    orderBy: { checkInDate: 'asc' },
  });
  const lookup = new Map(upcoming.map((entry) => [entry.id, entry]));

  return runLeadTimeBatch({
    bookings: upcoming.map((booking) => ({ id: booking.id, scheduleDate: booking.checkInDate })),
    type: 'HOST_PREP_THREE_DAY',
    sender: async (bookingId) => {
      const booking = lookup.get(bookingId);
      if (!booking) {
        throw new Error(`Booking ${bookingId} not found for host prep three-day email`);
      }
      const payload = buildHostPrepThreeDayOptions(booking, opsDetails);
      return sendHostPrepThreeDay({ ...payload, bookingId });
    },
    now,
    leadHours: HOST_PREP_THREE_DAY_LEAD,
    toleranceHours: HOST_PREP_THREE_DAY_TOLERANCE,
  });
}

async function handleHostPrepSameDay(now: Date, opsDetails: Awaited<ReturnType<typeof getOpsDetails>>): Promise<BatchSummary> {
  const upcoming = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      checkInDate: {
        gte: now,
        lte: addHours(now, HOST_PREP_SAME_DAY_LEAD + HOST_PREP_SAME_DAY_TOLERANCE),
      },
    },
    include: { property: true },
    orderBy: { checkInDate: 'asc' },
  });

  const lookup = new Map(upcoming.map((entry) => [entry.id, entry]));

  return runLeadTimeBatch({
    bookings: upcoming.map((booking) => ({ id: booking.id, scheduleDate: booking.checkInDate })),
    type: 'HOST_PREP_SAME_DAY',
    sender: async (bookingId) => {
      const booking = lookup.get(bookingId);
      if (!booking) {
        throw new Error(`Booking ${bookingId} not found for host prep same-day email`);
      }
      const payload = buildHostPrepSameDayOptions(booking, opsDetails);
      return sendHostPrepSameDay({ ...payload, bookingId });
    },
    now,
    leadHours: HOST_PREP_SAME_DAY_LEAD,
    toleranceHours: HOST_PREP_SAME_DAY_TOLERANCE,
  });
}

const MID_STAY_DELAY_HOURS = 18; // 10 AM day after check-in (assuming 4pm checkin)
const MID_STAY_TOLERANCE = 4;

async function handleMidStayCheckIn(now: Date): Promise<BatchSummary> {
  // We want to target books where checkInDate + MID_STAY_DELAY_HOURS is roughly NOW.
  // This is a "Lead Time" of negative hours (Delay).
  // Our runLeadTimeBatch logic uses leadHours as "Hours BEFORE event".
  // Event = CheckInDate.
  // We want trigger at CheckIn + 18.
  // So leadHours = -18.

  const targetStart = addHours(now, -(MID_STAY_DELAY_HOURS + MID_STAY_TOLERANCE));
  const targetEnd = addHours(now, -MID_STAY_DELAY_HOURS);

  // But prisma query needs to find bookings where checkIn match these.
  // checkIn >= targetStart AND checkIn <= targetEnd

  const active = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      checkInDate: {
        gte: targetStart,
        lte: targetEnd,
      },
      // Ensure we don't send if they checkout today? (1 night stay)
      // If 1 night stay, checkIn=Day1, CheckOut=Day2 11am.
      // Trigger at 10am Day 2 is tight but okay.
      // But maybe exclude if checkOutDate <= now?
    },
    select: { id: true, checkInDate: true },
  });

  const bookings: BasicBookingRecord[] = active.map((booking) => ({
    id: booking.id,
    scheduleDate: booking.checkInDate,
  }));

  return runLeadTimeBatch({
    bookings,
    type: 'MID_STAY_CONCIERGE',
    sender: (bookingId) => sendMidStayCheckIn(bookingId), // Assuming signature is (bookingId)
    now,
    leadHours: -MID_STAY_DELAY_HOURS,
    toleranceHours: MID_STAY_TOLERANCE,
  });
}

const DOOR_CODE_LEAD_HOURS = 24;

async function handleDoorCodeDelivery(now: Date): Promise<BatchSummary> {
  const upcoming = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      checkInDate: {
        gte: now,
        lte: addHours(now, DOOR_CODE_LEAD_HOURS + PRE_STAY_TOLERANCE_HOURS),
      },
    },
    include: { property: true },
    orderBy: { checkInDate: 'asc' },
  });

  const bookings = upcoming.filter(b => b.property.lockboxCode || b.property.garageCode || b.property.skiLockerDoorCode);

  return runLeadTimeBatch({
    bookings: bookings.map(b => ({ id: b.id, scheduleDate: b.checkInDate })),
    type: 'DOOR_CODE_DELIVERY',
    sender: async (bookingId) => {
      const booking = upcoming.find(b => b.id === bookingId);
      if (!booking) return;

      const code = booking.property.lockboxCode ??
        booking.property.garageCode ??
        booking.property.skiLockerDoorCode;

      if (!code) return; // Should be filtered already, but safe guard

      await sendDoorCodeEmail(bookingId, {
        doorCode: code,
        // We could populate specific entry steps here if we had them structured on the property
      });
    },
    now,
    leadHours: DOOR_CODE_LEAD_HOURS,
    toleranceHours: PRE_STAY_TOLERANCE_HOURS,
  });
}

type LeadTimeBatchConfig<T extends BasicBookingRecord = BasicBookingRecord> = {
  bookings: T[];
  type: EmailType;
  sender: (bookingId: number, booking?: T) => Promise<unknown>;
  now: Date;
  leadHours: number;
  toleranceHours: number;
};

async function runLeadTimeBatch<T extends BasicBookingRecord>(config: LeadTimeBatchConfig<T>): Promise<BatchSummary> {
  const { bookings, type, sender, now, leadHours, toleranceHours } = config;
  const summary: BatchSummary = { total: bookings.length, sent: 0, skipped: 0, errors: 0 };

  if (bookings.length === 0) {
    return summary;
  }

  const alreadySent = await fetchSentMap(type, bookings.map((item) => item.id));

  for (const booking of bookings) {
    if (alreadySent.has(booking.id)) {
      summary.skipped += 1;
      continue;
    }

    const due = isDueWithinTolerance(booking.scheduleDate, leadHours, now, toleranceHours);
    if (!due) {
      summary.skipped += 1;
      continue;
    }

    try {
      await sender(booking.id, booking);
      summary.sent += 1;
    } catch (error) {
      summary.errors += 1;
      console.error(`[cron][${type}] Failed to send automation`, { bookingId: booking.id, error });
    }
  }

  return summary;
}

function isDueWithinTolerance(date: Date, leadHours: number, now: Date, toleranceHours: number) {
  const dueAt = addHours(date, -leadHours);
  if (dueAt > now) {
    return false;
  }
  const earliest = addHours(now, -toleranceHours);
  return dueAt >= earliest;
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

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * HOURS_IN_MS);
}
