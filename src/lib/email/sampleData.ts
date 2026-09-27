
import { BookingConfirmationEmailProps } from '@/emails/BookingConfirmationEmail';
import { BookingWelcomeEmailProps } from '@/emails/BookingWelcomeEmail';
import { DoorCodeEmailProps } from '@/emails/DoorCodeEmail';

import { HostGuestCancelledEmailProps } from '@/emails/HostGuestCancelledEmail';
import { HostNotificationEmailProps } from '@/emails/HostNotificationEmail';
import { HostPrepSameDayEmailProps } from '@/emails/HostPrepSameDayEmail';
import { HostPrepThreeDayEmailProps } from '@/emails/HostPrepThreeDayEmail';
import { HostRefundAdjustmentEmailProps } from '@/emails/HostRefundAdjustmentEmail';
import { PaymentFailureEmailProps } from '@/emails/PaymentFailureEmail';
import { PreStay24hEmailProps } from '@/emails/PreStay24hEmail';
import { PreStayReminderEmailProps } from '@/emails/PreStayReminderEmail';
import { ReceiptEmailProps } from '@/emails/ReceiptEmail';
import { ReviewRequestEmailProps } from '@/emails/ReviewRequestEmail';
import { MidStayCheckInEmailProps } from '@/emails/MidStayCheckInEmail';
import { CheckoutReminderEmailProps } from '@/emails/CheckoutReminderEmail';
import { GuestRefundIssuedEmailProps } from '@/emails/GuestRefundIssuedEmail';
import { CancellationConfirmationEmailProps } from '@/emails/CancellationConfirmationEmail';
import { STEAMBOAT_GUIDE } from '@/data/steamboatGuide';
import {
  getSteamboatBookingConfirmationSlice,
  getSteamboatPreStaySlice,
  getSteamboatCheckoutSlice,
} from '@/lib/guides/steamboatEmailSlices';

const CHECK_IN = new Date('2025-02-14T15:00:00Z');
const CHECK_OUT = new Date('2025-02-18T10:00:00Z');

export function sampleBookingConfirmationProps(): BookingConfirmationEmailProps {
  const confirmationSlice = getSteamboatBookingConfirmationSlice();
  return {
    guestName: 'Maya',
    propertyName: STEAMBOAT_GUIDE.propertyBasics.name,
    propertyLocation: 'Steamboat Springs, CO',
    checkInDate: CHECK_IN.toDateString(),
    checkOutDate: CHECK_OUT.toDateString(),
    nights: 4,
    totalPaid: '$2,480.00',
    checkInGuideUrl: 'https://bunks.com/guide/steamboat-alpenglow-2',
    guestBookUrl: 'https://bunks.com/guide/steamboat-alpenglow-2',
    hostSupportEmail: 'stay@bunks.com',
    hostPhoneNumber: STEAMBOAT_GUIDE.propertyBasics.hosts[0].phone,
    mapUrl: 'https://maps.apple.com/?address=45%206th%20Street,%20Steamboat%20Springs',
    arrivalNotes: confirmationSlice.arrivalNotes,
    directions: confirmationSlice.directions,
    essentials: confirmationSlice.essentials,
  };
}

export function sampleBookingWelcomeProps(): BookingWelcomeEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    propertyTagline: 'Snow-dusted pines, a glowing fireplace, and your own private hot tub await.',
    stayInfo: [
      { label: 'Stay dates', value: '14 Feb – 18 Feb, 2025', helper: '4 nights' },
      { label: 'Check-in window', value: 'Friday from 16:00', helper: 'Self check-in · smart lock' },
      { label: 'Check-out', value: 'Tuesday by 10:00', helper: 'Cleaners arrive shortly after' },
      { label: 'Guests', value: '4 people', helper: 'Let us know if this changes' },
    ],
    quickLinks: [
      {
        label: 'Check-in guide',
        href: 'https://bunks.com/guides/summit-ridge',
        description: 'Access codes, parking, lock info',
      },
      {
        label: 'Guest book',
        href: 'https://bunks.com/guestbook/summit-ridge',
        description: 'Local picks, FAQs, and scenic drives',
      },
    ],
    houseRules: [
      'No smoking indoors or on the decks – sensors will alert us.',
      'Quiet hours are 22:00–07:00 out of respect for neighbors.',
      'Please rinse and cover the hot tub after each soak.',
      'Lock doors and arm the security system whenever you leave.',
    ],
    hostContact: {
      email: 'ali@bunks.com',
      phone: '+1 (970) 555-0119',
      note: 'Text or email any time – average response under 5 minutes.',
    },
  };
}

export function samplePreStayReminderProps(): PreStayReminderEmailProps {
  const slice = getSteamboatPreStaySlice();
  return {
    guestName: 'Maya',
    propertyName: STEAMBOAT_GUIDE.propertyBasics.name,
    checkInDate: 'Fri, Feb 14 · 4 nights',
    weatherSummary: 'Sunny days with light snow showers at night · highs 42°F, lows 26°F',
    packingList: STEAMBOAT_GUIDE.packingLists.find((list) => list.season === 'winter')?.items ?? [],
    checkInGuideUrl: 'https://bunks.com/guide/steamboat-alpenglow-2',
    guestBookUrl: 'https://bunks.com/guide/steamboat-alpenglow-2',
    hostSupportEmail: 'stay@bunks.com',
    supportPhone: STEAMBOAT_GUIDE.propertyBasics.hosts[0].phone,
    essentials: slice.essentials,
    parkingNote: slice.parkingNote,
    quietHours: slice.quietHours,
    emergencyContacts: slice.emergencyContacts,
  };
}

export function samplePreStay24hProps(): PreStay24hEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    arrivalWindow: 'Tomorrow · Check-in between 16:00 – 20:00',
    weatherCallout: 'Expect light snow flurries overnight; temps 28–38°F. Roads are plowed but icy near the driveway.',
    roadStatus: 'Rabbit Ears Pass is clear. Chain law lifted as of 06:00 but watch shaded turns.',
    checkInGuideUrl: 'https://bunks.com/guides/summit-ridge',
    checkInChecklist: [
      { label: 'Confirm ETA', detail: 'Reply to this email with expected arrival so we can pre-heat the cabin.' },
      { label: 'Download instructions', detail: 'Cell service drops near the cabin—save the check-in guide offline.' },
      { label: 'Review parking plan', detail: 'Two cars max in the driveway · overflow lot across the lane.' },
    ],
    outstandingTasks: ['Share flight number or drive ETA', 'Confirm grocery allergies if anything changed'],
    hostSupportEmail: 'ali@bunks.com',
    hostSupportPhone: '+1 (970) 555-0119',
    supportNote: 'We respond in under 5 minutes · text anytime.',
  };
}

export function sampleHostNotificationProps(): HostNotificationEmailProps {
  return {
    hostName: 'Ali',
    propertyName: 'Summit Ridge Cabin',
    guestName: 'Maya Bennett',
    checkInDate: 'Fri, Feb 14',
    checkOutDate: 'Tue, Feb 18',
    nights: 4,
    totalPayout: '$2,120.00',
    addOns: [
      { name: 'Private chef dinner', notes: 'Confirm chef arrival 5pm' },
      { name: 'Ski rental delivery', notes: 'Drop-off Friday noon' },
    ],
    checklistItems: [
      'Stage welcome note and amenity basket',
      'Hot tub service scheduled Thursday',
      'Sync cleaners for checkout Tuesday 10am',
    ],
    calendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
    specialRequests: 'Guest arriving late due to evening flight — leave porch light on',
  };
}

export function sampleHostPrepThreeDayProps(): HostPrepThreeDayEmailProps {
  return {
    hostName: 'Leo',
    propertyName: 'Summit Ridge Cabin',
    propertyLocation: 'Steamboat Springs, CO',
    guestName: 'Maya Bennett',
    stayDates: 'Feb 14 – Feb 18',
    arrivalWindow: 'Check-in opens Fri · 16:00',
    nights: 4,
    headcount: '4 guests + 1 infant',
    housekeepingWindow: 'Thu · 11:00–14:30',
    quickFacts: [
      { label: 'Hot tub service', value: 'Scheduled', helper: 'Thu 14:45 · Powder Pros' },
      { label: 'Fridge restock', value: 'Confirmed', helper: 'Delivery Fri 10:00' },
      { label: 'Last review', value: '4.9 ★', helper: '“Pristine + cozy”' },
    ],
    prepTimeline: [
      {
        label: 'Deep clean + laundry flip',
        owner: 'Silverpeak Clean Co.',
        window: 'Thu · 11:00–14:30',
        status: 'scheduled',
        notes: 'Bring hypoallergenic linens per guest note.',
      },
      {
        label: 'Hot tub chemical balance',
        owner: 'Nate / Field Ops',
        window: 'Thu · 15:00',
        status: 'in-progress',
        notes: 'Drain/refill complete · balancing at 15:45.',
      },
      {
        label: 'Pre-arrival walk-through',
        owner: 'Priya / QA',
        window: 'Fri · 12:30',
        status: 'scheduled',
        notes: 'Confirm crib + blackout curtains setup.',
      },
    ],
    specialRequests: [
      'Stage Pack ’n Play in primary bedroom before walkthrough.',
      'Set indoor temp to 70°F one hour before arrival.',
      'Place welcome basket with nut-free snacks.',
    ],
    supplyReminders: [
      { item: 'Firewood bin', status: 'needs-restock', note: '2 bundles remaining · add 4 bundles.' },
      { item: 'Bath amenity kit', status: 'ordered', note: 'Amazon delivery arriving Thu 09:30.' },
      { item: 'Smart lock batteries', status: 'stocked', note: 'Spare set in utility closet.' },
    ],
    contacts: [
      { label: 'Ops desk', value: '+1 (970) 555-0101', note: '07:00–22:00 MT' },
      { label: 'Concierge', value: 'Priya · Slack #host-support', note: 'Vendor + VIP escalations' },
      { label: 'Emergency', value: '911 · share property code 8821' },
    ],
    attachments: [
      { label: 'Housekeeping run-sheet', href: 'https://bunks.com/internal/runsheet/host-12432', description: 'Checklist + timing' },
      { label: 'Guest profile', href: 'https://bunks.com/admin/guests/12432', description: 'Preferences + notes' },
    ],
    escalationNote: 'If baby gear vendor cannot confirm by Thu 18:00, alert ops for backup rental partner.',
  };
}

export function sampleHostPrepSameDayProps(): HostPrepSameDayEmailProps {
  return {
    hostName: 'Leo',
    propertyName: 'Summit Ridge Cabin',
    propertyLocation: 'Steamboat Springs, CO',
    guestName: 'Maya Bennett',
    arrivalWindow: 'Check-in opens 16:00 MT',
    etaLabel: 'ETA 15:35 (per SMS)',
    headcount: '4 guests + 1 infant',
    parkingNote: '2 SUVs · driveway',
    weatherNote: 'Snow flurries after 18:00',
    quickFacts: [
      { label: 'Lock code', value: '5539 ✱', helper: 'Auto-rotates at 12:00' },
      { label: 'Wi-Fi', value: 'SummitRidge_5G', helper: 'Pass: staycozy2025' },
      { label: 'Welcome basket', value: 'Stocked', helper: 'Nut-free snacks' },
    ],
    arrivalTasks: [
      {
        time: '08:30',
        title: 'Cleaner finishing touches',
        owner: 'Silverpeak Clean Co.',
        status: 'complete',
        detail: 'Floors drying—leave boot tray by foyer.',
      },
      {
        time: '11:45',
        title: 'HVAC pre-heat',
        owner: 'Nate / Field Ops',
        status: 'in-progress',
        detail: 'Set to 70°F at 12:30. Humidifier filled.',
      },
      {
        time: '14:15',
        title: 'Arrival walkthrough',
        owner: 'Priya / QA',
        status: 'pending',
        detail: 'Verify crib + blackout curtains, restage pillows.',
      },
    ],
    checklist: [
      { label: 'Smart lock + keypad', status: 'done', note: 'Tested 09:02 MT' },
      { label: 'Hot tub temp', status: 'pending', note: 'Heat to 102°F after walkthrough' },
      { label: 'Fridge restock receipt', status: 'attention', note: 'Leave on counter after delivery' },
    ],
    alerts: [
      {
        label: 'Driveway salted early',
        detail: 'Snow flurries likely at 18:00—sprinkle eco salt before sunset.',
        severity: 'warning',
      },
      {
        label: 'Guest arriving with infant',
        detail: 'Confirm Pack ’n Play + sound machine ready in primary bedroom.',
        severity: 'info',
      },
    ],
    contacts: [
      { role: 'Ops desk', person: 'Priya', contact: '+1 (970) 555-0101', note: '07:00–22:00 MT' },
      { role: 'Field ops', person: 'Nate Martinez', contact: '+1 (970) 555-0999' },
      { role: 'Concierge', person: 'Slack', contact: '#host-support' },
    ],
    attachments: [
      { label: 'Day-of run sheet', href: 'https://bunks.com/internal/runsheet/host-12432/day-of', description: 'Cleaner + concierge timeline' },
      { label: 'Guest profile', href: 'https://bunks.com/admin/guests/12432', description: 'Preferences + notes' },
    ],
    escalationNote: 'If baby gear vendor delays >30m, dispatch backup rental (Sprout Rentals) and update guest SMS thread.',
  };
}

export function sampleHostGuestCancelledProps(): HostGuestCancelledEmailProps {
  return {
    hostName: 'Ali',
    propertyName: 'Summit Ridge Cabin',
    guestName: 'Noah Patel',
    cancelledAt: 'Nov 28 · 08:12 MT',
    stayDates: 'Dec 12 – Dec 15',
    policyApplied: 'Flexible (48h)',
    refundSummary: {
      guestRefund: '$1,140.00',
      hostPayoutChange: '-$820.00',
      retention: '$320.00 service fees',
    },
    lineItems: [
      { label: 'Nightly rate refund', amount: '$840.00', type: 'credit' },
      { label: 'Cleaning fee refund', amount: '$180.00', type: 'credit' },
      { label: 'Bunks service fee', amount: '$120.00', type: 'charge', note: 'Retained per policy' },
    ],
    calendarActions: [
      { label: 'Calendar reopened Dec 12–15', status: 'done' },
      { label: 'Airbnb sync double-check', detail: 'Verify import at 08:30', status: 'in-progress' },
    ],
    rebookNote: 'Push SMS + email to waitlist for Dec 12–15 once calendar slot verified.',
    nextArrival: 'Dec 20 · 16:00',
    attachments: [
      { label: 'Cancellation audit log', href: 'https://bunks.com/admin/bookings/12510/audit', description: 'Policy + refund detail' },
    ],
  };
}

export function sampleHostRefundAdjustmentProps(): HostRefundAdjustmentEmailProps {
  return {
    hostName: 'Ali',
    propertyName: 'Summit Ridge Cabin',
    guestName: 'Maya Bennett',
    bookingId: 12432,
    processedAt: 'Nov 29 · 14:10 MT',
    adjustmentReason: 'Partial refund for heater issue',
    payoutBefore: '$2,120.00',
    payoutAfter: '$1,920.00',
    guestRefund: '$200.00',
    adjustments: [
      { label: 'Guest goodwill credit', amount: '$200.00', direction: 'debit', note: 'Applied to payout' },
      { label: 'Service fee rebate', amount: '$40.00', direction: 'credit', note: 'Bunks covering half the credit' },
    ],
    timeline: [
      { time: '13:05', label: 'Guest reported heater issue', status: 'done' },
      { time: '13:40', label: 'Ops approved refund', status: 'done' },
      { time: '14:10', label: 'Payout adjusted + guest emailed', status: 'done' },
    ],
    documents: [
      { label: 'Heater maintenance ticket', href: 'https://bunks.com/internal/incidents/8834', description: 'Photos + vendor invoice' },
    ],
    supportNote: 'Reply within 48h if you want us to contest or split differently.',
  };
}

export function sampleReviewRequestProps(): ReviewRequestEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    reviewUrl: 'https://bunks.com/review/summit-ridge?booking=123',
    stayHighlights: 'Hot tub nights under the stars and chef-prepped dinners by the fireplace.',
    incentiveCopy: 'Leave a review to unlock 15% off your next visit.',
    supportEmail: 'ali@bunks.com',
  };
}

export function sampleGuestRefundIssuedProps(): GuestRefundIssuedEmailProps {
  return {
    guestName: 'Maya Bennett',
    propertyName: 'Summit Ridge Cabin',
    bookingId: 48291,
    refundTotal: '$420.00',
    currencyNote: 'Processed in USD · converts automatically if your bank bills in another currency',
    paymentMethod: 'Visa •• 4242',
    statementDescriptor: 'Bunks*SummitRidge',
    refundReason: 'Partial refund after fireplace outage on Feb 17',
    initiatedAt: 'Wed · Feb 19 · 10:12 MT',
    expectedArrivalWindow: '3–5 business days',
    lineItems: [
      { label: 'Nightly credit (Feb 17)', amount: '$320.00', note: '50% goodwill credit for interrupted evening' },
      { label: 'Firewood surcharge reversal', amount: '$60.00', note: 'Removed because crew restocked late' },
      { label: 'Concierge fee refund', amount: '$40.00', note: 'Applies to snowcat logistics assistance' },
    ],
    timeline: [
      {
        label: 'Issue reported',
        detail: 'You texted concierge at 21:05 MT when fireplace remote failed.',
        status: 'complete',
      },
      {
        label: 'Ops approved refund',
        detail: 'Duty manager Alissa authorized the credit after vendor diagnosis.',
        status: 'complete',
      },
      {
        label: 'Funds in transit',
        detail: 'Stripe released the refund to your bank. Watch for pending status in 24h.',
        status: 'in-progress',
      },
    ],
    support: {
      email: 'hello@bunks.com',
      phone: '+1 (970) 555-0119',
      concierge: '+1 (970) 555-0458',
      note: 'Concierge replies 07:00–22:00 MT · average response under 6 minutes.',
    },
    extraNotes: [
      'You will receive a Stripe receipt once the card issuer posts the refund.',
      'Need documentation for travel insurance? Reply and we will send a signed PDF.',
      'If the bank still shows the original authorization after 7 days, text us a screenshot so we can escalate.',
    ],
    policyUrl: 'https://bunks.com/policies/flexible-refunds',
  };
}

export function sampleReceiptProps(): ReceiptEmailProps {
  return {
    guestName: 'Maya Bennett',
    propertyName: 'Summit Ridge Cabin',
    stayDates: 'Feb 14 – Feb 18, 2025',
    lineItems: [
      { label: 'Nightly rate · 4 nights', amount: '$2,000.00' },
      { label: 'Cleaning fee', amount: '$180.00' },
      { label: 'Service fee', amount: '$120.00' },
      { label: 'Concierge services', amount: '$180.00' },
    ],
    total: '$2,480.00',
    paymentMethod: 'Visa •• 4242',
    supportEmail: 'hello@bunks.com',
  };
}

export function sampleDoorCodeProps(): DoorCodeEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    arrivalDate: 'Fri, Feb 14',
    arrivalWindow: '16:00 – 20:00',
    doorCode: '4829·#',
    codeValidWindow: 'Active Feb 14 14:00 – Feb 18 11:00',
    parkingInfo: [
      {
        title: 'Driveway parking',
        detail: 'Park nose-in. Plowed daily · two cars max to avoid blocking the lane.',
      },
      {
        title: 'Overflow option',
        detail: 'Lot across the lane · grab the hanging tag from the mudroom hook.',
      },
    ],
    entrySteps: [
      { title: 'Keypad location', detail: 'Left of the mudroom door under the covered awning.' },
      { title: 'Wake the lock', detail: 'Tap ✷ then enter the code followed by # within 5 seconds.' },
      { title: 'Locking up', detail: 'Press ✷ and wait for the green flash before walking away.' },
    ],
    wifi: { network: 'SummitRidge-Guest', password: 'pinecones42' },
    backupPlan: [
      { title: 'Backup lockbox', detail: 'Code 7711 · mounted behind the propane tank cover.' },
      { title: 'Manual key', detail: 'Inside lockbox · please return after use.' },
    ],
    securityNotes: [
      'Disable the alarm panel inside the entry hall within 60 seconds.',
      'Lock doors whenever you leave—elk love nudging handles.',
    ],
    support: {
      email: 'ops@bunks.com',
      phone: '+1 (970) 555-0124',
      concierge: '+1 (970) 555-0901',

    },
  };
}

export function sampleMidStayCheckInProps(): MidStayCheckInEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    stayProgress: 'Day 2 of 4',
    vibeLine: 'How are the slopes treating you? We can tweak anything—from shuttle times to pantry restocks.',
    weatherCallout: 'Bluebird morning at 36°F climbing to 48°F by afternoon · light winds, perfect for an outdoor soak.',
    todaysFocus: [
      {
        label: 'Morning check',
        detail: 'Shuttle arrives 08:00 sharp. Reply if you need to bump to 09:00 and we will confirm within minutes.',
      },
      {
        label: 'Hot tub crew',
        detail: 'Service stop scheduled 13:30. Please keep the cover on beforehand so temps stay high.',
      },
    ],
    housekeepingReminders: [
      'Hang damp gear on the drying rack in the mudroom so the humidifiers keep up.',
      'Please latch balcony doors when you leave—winds pick up after 3pm.',
    ],
    guestBookUrl: 'https://bunks.com/guestbook/summit-ridge',
    issueReportingUrl: 'https://bunks.com/support/issues/new',
    support: {
      email: 'concierge@bunks.com',
      phone: '+1 (970) 555-0119',
      concierge: '+1 (970) 555-0901',
      note: 'Concierge online daily 07:00–22:00 MT · replies within 5 minutes.',
    },
  };
}

export function sampleCancellationConfirmationProps(): CancellationConfirmationEmailProps {
  return {
    guestName: 'Maya Bennett',
    propertyName: 'Summit Ridge Cabin',
    stayDates: 'Feb 15 – Feb 19, 2025',
    bookingId: 48291,
    cancelledAt: 'Wed · Jan 29 · 09:42 MT',
    cancellationInitiator: 'Guest via self-serve portal',
    cancellationReason: 'Flight cancellations ahead of the incoming storm system',
    refundTotal: '$1,820.00',
    refundMethod: 'Visa •• 4242',
    refundTimeline: '3–5 business days',
    statementDescriptor: 'Bunks*SummitRidge',
    refundLineItems: [
      { label: 'Nightly charges (3 nights)', amount: '$1,560.00', note: '$520/night refunded in full' },
      { label: 'Cleaning fee', amount: '$180.00' },
      {
        label: 'Service fee retained',
        amount: '$80.00',
        note: 'Retained per flexible policy inside 14 days',
        retained: true,
      },
      {
        label: 'Private chef deposit',
        amount: '$40.00',
        note: 'Kitchen already sourced ingredients',
        retained: true,
      },
    ],
    policyHighlights: [
      {
        title: 'Flexible policy window',
        detail: 'Full refund up to 14 days prior; afterwards service fees + vendor deposits may be retained.',
      },
      {
        title: 'Weather credit',
        detail: '50% credit toward a future stay when cancellations are due to confirmed travel disruptions.',
      },
    ],
    rebookingOffer: {
      headline: 'Ready to reschedule when you are',
      description: 'Apply a $350 credit toward any Bunks stay when you rebook within 60 days.',
      ctaLabel: 'Browse new dates',
      ctaUrl: 'https://bunks.com/properties',
      note: 'Credit auto-applies once you sign in with this booking email.',
    },
    extraNotes: [
      'We triggered refunds at 09:42 MT; your bank controls final posting speed.',
      'Reply if you would like us to hold the same home for alternative February dates.',
      'Travel insurance providers often request this email as proof of cancellation—feel free to forward it.',
    ],
    support: {
      email: 'hello@bunks.com',
      phone: '+1 (970) 555-0119',
      concierge: '+1 (970) 555-0458',
      note: 'Concierge replies in under 10 minutes during 07:00–22:00 MT.',
    },
  };
}

export function samplePaymentFailureProps(): PaymentFailureEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    bookingId: 48291,
    stayDates: 'Feb 15 – Feb 19',
    amountDue: '$2,480.00',
    dueBy: 'Today · 18:00 MT',
    failureReason: 'card_declined · insufficient_funds',
    lastAttempt: 'Today · 16:42 MT',
    paymentLink: 'https://bunks.com/pay/48291',
    alternateMethods: ['Apple Pay via the link above', 'Wire transfer · reply for instructions'],
    actionItems: [
      {
        label: 'Update card on file',
        detail: 'Use the secure link to add a new card or re-run the existing one.',
      },
      {
        label: 'Need a short extension?',
        detail: 'Reply to this email so we can keep the calendar blocked for a few extra hours.',
      },
    ],
    support: {
      email: 'billing@bunks.com',
      phone: '+1 (970) 555-0901',
      note: 'Finance desk monitors this thread 7 days a week.',
    },
  };
}

export function sampleCheckoutReminderProps(): CheckoutReminderEmailProps {
  const checkoutSlice = getSteamboatCheckoutSlice();
  return {
    guestName: 'Maya',
    propertyName: STEAMBOAT_GUIDE.propertyBasics.name,
    checkoutDate: 'Tue, Feb 18',
    checkoutTime: STEAMBOAT_GUIDE.propertyBasics.checkOutTime,
    cleanerArrivalWindow: 'Cleaners arrive 10:30–11:00',
    lateCheckoutNote: 'Need a late checkout? Reply here and we’ll confirm availability.',
    weatherCallout: 'Snow showers expected tomorrow evening—allow extra time if you’re driving over Rabbit Ears Pass.',
    propertyAddress: STEAMBOAT_GUIDE.propertyBasics.address,
    directionsUrl: 'https://maps.apple.com/?address=45%206th%20Street,%20Steamboat%20Springs',
    parkingNote: STEAMBOAT_GUIDE.checkinCheckout.parking,
    keySteps: checkoutSlice.checkoutSteps,
    lockupSteps: checkoutSlice.lockupSteps,
    trashNote: checkoutSlice.trashNote,
    kitchenReminders: ['Clean coffee carafe + grinders', 'Wipe fridge shelves if spills'],
    laundryReminders: ['Start one load of towels if you have time', 'Leave duvets folded on beds'],
    addOnReturns: [
      { title: 'Baby gear rental', detail: 'Leave crib + high-chair in the downstairs bedroom.', status: 'Pickup 12:30' },
    ],
    support: {
      email: 'stay@bunks.com',
      phone: STEAMBOAT_GUIDE.propertyBasics.hosts[0].phone,
      concierge: STEAMBOAT_GUIDE.propertyBasics.hosts[1].phone,
      note: 'Text for last-minute questions—we reply in under 5 minutes.',
    },
  };
}

