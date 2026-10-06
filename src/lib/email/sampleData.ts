
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
import { CANCELLATION_POLICY } from '@/data/policies';
import { SUPPORT_EMAIL } from '@/lib/contact';
import { CHECKOUT_CHECKLIST } from '@/emails/checkoutChecklist';
import { PaymentLinkEmailProps } from '@/emails/PaymentLinkEmail';
import { STEAMBOAT_GUIDE } from '@/data/steamboatGuide';
import {
  getSteamboatPreStaySlice,
} from '@/lib/guides/steamboatEmailSlices';
import { mapsUrlFor, privateDetailsFor } from '@/lib/privatePropertyDetails';

const STEAMBOAT_PRIVATE = privateDetailsFor('steamboat-downtown-townhome');


export function sampleBookingConfirmationProps(): BookingConfirmationEmailProps {
  return {
    guestFirstName: 'Taylor',
    propertyName: 'Downtown Steamboat Luxury Townhome',
    bookingReference: 'K7Q2M',
    stayDates: 'Feb 14 – Feb 18, 2027',
    checkIn: 'Sun, February 14 · from 3:00 PM',
    checkOut: 'Thu, February 18 · by 10:00 AM',
    nights: 4,
    guests: 4,
    chargeLines: [
      { label: '4 nights (10% direct-booking discount applied)', amount: '$2,160.00' },
      { label: 'Cleaning fee', amount: '$250.00' },
      { label: 'Service fee', amount: '$108.00' },
      { label: 'Taxes', amount: '$241.00' },
    ],
    totalPaid: '$2,759.00',
    tripUrl: 'https://www.bunks.com/my-trips/K7Q2M/essential',
    guideUrl: 'https://www.bunks.com/api/guides/steamboat-downtown-townhome/guide?ref=K7Q2M',
    cancellationPolicy: CANCELLATION_POLICY.summary,
    supportEmail: SUPPORT_EMAIL,
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
    propertyName: 'Downtown Steamboat Luxury Townhome',
    guestName: 'Taylor Morgan',
    guestEmail: 'taylor@example.com',
    guests: 4,
    stayDates: 'Feb 14 – Feb 18, 2027',
    nights: 4,
    totalPaid: '$2,759.00',
    bookingReference: 'K7Q2M',
    source: 'Website checkout',
    adminUrl: 'https://www.bunks.com/admin/messages',
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
    propertyName: 'Downtown Steamboat Luxury Townhome',
    guestName: 'Taylor Morgan',
    stayDates: 'Feb 14 – Feb 18, 2027',
    bookingReference: 'K7Q2M',
    refundAmount: '$2,759.00',
    cancelledBy: 'ali@bunks.com',
    adminUrl: 'https://www.bunks.com/admin/messages',
  };
}

export function sampleHostRefundAdjustmentProps(): HostRefundAdjustmentEmailProps {
  return {
    propertyName: 'Downtown Steamboat Luxury Townhome',
    guestName: 'Taylor Morgan',
    stayDates: 'Feb 14 – Feb 18, 2027',
    bookingReference: 'K7Q2M',
    refundAmount: '$250.00',
    bookingCancelled: false,
    adminUrl: 'https://www.bunks.com/admin/messages',
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
    guestFirstName: 'Taylor',
    propertyName: 'Downtown Steamboat Luxury Townhome',
    bookingReference: 'K7Q2M',
    stayDates: 'Feb 14 – Feb 18, 2027',
    refundAmount: '$250.00',
    bookingCancelled: false,
    supportEmail: SUPPORT_EMAIL,
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
  const address = STEAMBOAT_PRIVATE?.address ?? null;
  return {
    guestFirstName: 'Taylor',
    propertyName: 'Downtown Steamboat Luxury Townhome',
    arrivalHeadline: 'See you tomorrow',
    checkIn: 'Sun, February 14 · from 3:00 PM',
    checkOut: 'Thu, February 18 · by 10:00 AM',
    address,
    mapsUrl: address ? mapsUrlFor(address) : null,
    codeLabel: 'Lockbox code',
    doorCode: '1234',
    entrySteps: [
      { title: 'Garage code', detail: '5678' },
      { title: 'Ski locker', detail: 'Locker 36 · code 2222' },
    ],
    parkingInfo: STEAMBOAT_PRIVATE?.parkingNotes ? [{ title: 'Where to park', detail: STEAMBOAT_PRIVATE.parkingNotes }] : [],
    wifi: { network: 'Townhouse2', password: 'Steamboat' },
    tripUrl: 'https://www.bunks.com/my-trips/K7Q2M/essential',
    bookingReference: 'K7Q2M',
    supportEmail: SUPPORT_EMAIL,
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
    guestFirstName: 'Taylor',
    propertyName: 'Downtown Steamboat Luxury Townhome',
    bookingReference: 'K7Q2M',
    stayDates: 'Feb 14 – Feb 18, 2027',
    refundAmount: '$2,759.00',
    cancellationPolicy: CANCELLATION_POLICY.summary,
    rebookUrl: 'https://www.bunks.com',
    supportEmail: SUPPORT_EMAIL,
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
  return {
    guestFirstName: 'Taylor',
    propertyName: 'Downtown Steamboat Luxury Townhome',
    checkoutDay: 'tomorrow',
    checkoutDate: 'Thu, Feb 18',
    checkoutTime: '10:00 AM',
    checklist: CHECKOUT_CHECKLIST,
    bookingReference: 'K7Q2M',
    supportEmail: SUPPORT_EMAIL,
  };
}


export function samplePaymentLinkProps(): PaymentLinkEmailProps {
  return {
    guestFirstName: 'Robin',
    propertyName: 'Summerland Ocean-View Beach Bungalow',
    stayDates: 'Nov 20 – Nov 23, 2026',
    chargeLines: [
      { label: '3 nights', amount: '$2,100.00' },
      { label: 'Cleaning fee', amount: '$250.00' },
      { label: 'Taxes', amount: '$282.00' },
    ],
    total: '$2,632.00',
    payUrl: 'https://www.bunks.com/pay/example',
    holdUntil: 'Thu, Oct 8, 3:54 PM PDT',
    supportEmail: SUPPORT_EMAIL,
  };
}
