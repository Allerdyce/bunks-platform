import type { Booking, Property } from '@prisma/client';
import {
  calculateNights,
  formatDateForEmail,
  formatStayDates,
  resolveBookingReference,
  resolveCheckInGuideUrl,
  resolveGuestBookUrl,
} from '@/lib/email';
import type { OpsDetails } from '@/lib/opsDetails/config';
import { toAbsoluteUrl } from '@/lib/url';
import type { SendHostPrepThreeDayOptions } from '@/lib/email/sendHostPrepThreeDay';
import type { SendHostPrepSameDayOptions } from '@/lib/email/sendHostPrepSameDay';

const HOURS_IN_MS = 60 * 60 * 1000;

const dayFormatterCache = new Map<string, Intl.DateTimeFormat>();
const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();

type BookingWithProperty = Booking & { property: Property };

type Attachment = { label: string; href: string; description?: string };

type ContactRecord = { label: string; value: string; note?: string };

type SupplyReminder = { item: string; status: 'stocked' | 'needs-restock' | 'ordered'; note: string };

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * HOURS_IN_MS);
}

function formatDay(date: Date, timeZone: string) {
  const cacheKey = `${timeZone}-day`;
  if (!dayFormatterCache.has(cacheKey)) {
    dayFormatterCache.set(
      cacheKey,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    );
  }
  return dayFormatterCache.get(cacheKey)!.format(date);
}

function formatTime(date: Date, timeZone: string) {
  const cacheKey = `${timeZone}-time`;
  if (!timeFormatterCache.has(cacheKey)) {
    timeFormatterCache.set(
      cacheKey,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    );
  }
  return timeFormatterCache.get(cacheKey)!.format(date);
}

function formatWindowLabel(base: Date, offsetHours: number, windowLabel: string, timeZone: string) {
  const target = addHours(base, offsetHours);
  return `${formatDay(target, timeZone)} · ${windowLabel}`;
}

function buildContacts(details: OpsDetails): ContactRecord[] {
  const contacts: ContactRecord[] = [];
  if (details.opsDeskPhone) {
    contacts.push({ label: 'Ops desk', value: details.opsDeskPhone, note: details.opsDeskHours ?? undefined });
  }
  if (details.supportSmsNumber) {
    contacts.push({ label: 'Support SMS', value: details.supportSmsNumber, note: 'Text 07:00–22:00 MT' });
  }
  if (details.conciergeContact) {
    contacts.push({ label: 'Concierge', value: details.conciergeContact, note: details.conciergeNotes ?? undefined });
  }
  return contacts;
}

function buildAttachments(booking: BookingWithProperty, details: OpsDetails): Attachment[] {
  const attachments: Attachment[] = [];
  const liveInstructions = resolveCheckInGuideUrl(booking);
  const guestBook = resolveGuestBookUrl(booking);
  const arrivalNotes = toAbsoluteUrl(details.arrivalNotesUrl);

  if (liveInstructions) {
    attachments.push({ label: 'Live instructions', href: liveInstructions, description: 'Access codes + arrival notes' });
  }
  if (arrivalNotes) {
    attachments.push({ label: 'Arrival overview', href: arrivalNotes, description: 'Parking + routing' });
  }
  if (guestBook) {
    attachments.push({ label: 'Guest book', href: guestBook, description: 'FAQs, itineraries, local intel' });
  }

  return attachments;
}

function buildSupplyReminders(): SupplyReminder[] {
  return [
    { item: 'Welcome basket', status: 'stocked', note: 'Refresh standard snacks + sparkling water.' },
    { item: 'Firewood bin', status: 'needs-restock', note: 'Top off porch bin before arrival.' },
    { item: 'Smart lock batteries', status: 'ordered', note: 'Spare set en route—swap during walkthrough.' },
  ];
}

function buildThreeDayTimeline(checkIn: Date, timeZone: string) {
  return [
    {
      label: 'Deep clean + linens reset',
      owner: 'Ops crew',
      window: formatWindowLabel(checkIn, -24, '11:00–14:00', timeZone),
      status: 'scheduled' as const,
      notes: 'Standard turnover before arrival.',
    },
    {
      label: 'Hot tub + exterior sweep',
      owner: 'Field ops',
      window: formatWindowLabel(checkIn, -20, '15:00', timeZone),
      status: 'scheduled' as const,
      notes: 'Balance chemicals + clear pathways.',
    },
    {
      label: 'Pre-arrival walkthrough',
      owner: 'QA lead',
      window: formatWindowLabel(checkIn, -4, '12:30', timeZone),
      status: 'scheduled' as const,
      notes: 'Confirm staging, temp, and amenity basket.',
    },
  ];
}

function buildSameDayArrivalTasks(checkIn: Date, timeZone: string) {
  return [
    {
      time: formatTime(addHours(checkIn, -8), timeZone),
      title: 'Cleaner finishing touches',
      owner: 'Ops crew',
      status: 'in-progress' as const,
      detail: 'Resetting kitchen + laundering spa towels.',
    },
    {
      time: formatTime(addHours(checkIn, -5), timeZone),
      title: 'HVAC + lighting prep',
      owner: 'Field ops',
      status: 'pending' as const,
      detail: 'Pre-heat to 70°F and stage welcome lighting.',
    },
    {
      time: formatTime(addHours(checkIn, -2), timeZone),
      title: 'Arrival walkthrough',
      owner: 'QA lead',
      status: 'pending' as const,
      detail: 'Verify crib setup, welcome basket, and lockcodes.',
    },
  ];
}

function buildSameDayChecklist() {
  return [
    { label: 'Smart lock + keypad', status: 'done' as const, note: 'Tested and synced with concierge SMS.' },
    { label: 'Hot tub temp', status: 'pending' as const, note: 'Heat to 102°F after walkthrough.' },
    { label: 'Garage + driveway', status: 'attention' as const, note: 'Spot-check for ice after sunset.' },
  ];
}

function buildSameDayAlerts() {
  return [
    {
      label: 'Road conditions',
      detail: 'Driveway can be slick if temps drop—salt is staged by the entry bin.',
      severity: 'warning' as const,
    },
    {
      label: 'Pack ’n Play requested',
      detail: 'Stage crib and sound machine in the primary bedroom before walkthrough.',
      severity: 'info' as const,
    },
  ];
}

export function buildHostPrepThreeDayOptions(
  booking: BookingWithProperty,
  details: OpsDetails,
): SendHostPrepThreeDayOptions {
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const nights = calculateNights(checkIn, checkOut);
  const stayDates = formatStayDates(checkIn, checkOut);
  const arrivalWindow = `${formatDateForEmail(checkIn)} · ${details.checkInWindow ?? 'Check-in after 16:00'}`;
  const supplyReminders = buildSupplyReminders();
  const attachments = buildAttachments(booking, details);

  return {
    bookingId: booking.id,
    propertyName: booking.property.name,
    propertyLocation: undefined,
    guestName: booking.guestName,
    stayDates,
    arrivalWindow,
    nights,
    headcount: 'Guest party confirmed',
    housekeepingWindow: formatWindowLabel(checkIn, -24, '11:00–14:00', booking.property.timezone),
    specialRequests: ['Verify welcome basket + HVAC before the walkthrough.'],
    prepTimeline: buildThreeDayTimeline(checkIn, booking.property.timezone),
    supplyReminders,
    quickFacts: [
      { label: 'Stay length', value: `${nights} nights`, helper: stayDates },
      { label: 'Check-in window', value: details.checkInWindow ?? 'After 16:00', helper: booking.property.timezone },
      { label: 'Primary guest', value: booking.guestName, helper: booking.guestEmail },
    ],
    contacts: buildContacts(details),
    attachments: attachments.length ? attachments : undefined,
    escalationNote: 'Reply to ops desk if staffing or vendor schedules need tweaks.',
  };
}

export function buildHostPrepSameDayOptions(
  booking: BookingWithProperty,
  details: OpsDetails,
): SendHostPrepSameDayOptions {
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const nights = calculateNights(checkIn, checkOut);
  const stayDates = formatStayDates(checkIn, checkOut);
  const arrivalWindow = `${formatDateForEmail(checkIn)} · ${details.checkInWindow ?? 'Check-in after 16:00'}`;
  const attachments = buildAttachments(booking, details);
  const bookingReference = resolveBookingReference(booking);

  return {
    bookingId: booking.id,
    propertyName: booking.property.name,
    propertyLocation: undefined,
    guestName: booking.guestName,
    arrivalWindow,
    etaLabel: 'ETA auto-tracked · reply with updates',
    headcount: 'Guest party confirmed',
    parkingNote: 'Use driveway parking; overflow available per guest guide.',
    weatherNote: 'Watch for quick temperature drops after sunset; salt is staged by entry.',
    arrivalTasks: buildSameDayArrivalTasks(checkIn, booking.property.timezone),
    checklist: buildSameDayChecklist(),
    alerts: buildSameDayAlerts(),
    contacts: buildContacts(details).map((contact) => ({
      role: contact.label,
      person: contact.label,
      contact: contact.value,
      note: contact.note,
    })),
    quickFacts: [
      { label: 'Stay length', value: `${nights} nights`, helper: stayDates },
      { label: 'Check-in window', value: details.checkInWindow ?? 'After 16:00', helper: booking.property.timezone },
      { label: 'Booking ref', value: bookingReference },
    ],
    attachments: attachments.length ? attachments : undefined,
    escalationNote: 'Reply to ops desk if you need to adjust staffing or timelines today.',
  };
}
