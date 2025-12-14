
import { BookingConfirmationEmailProps } from '@/emails/BookingConfirmationEmail';
import { BookingWelcomeEmailProps } from '@/emails/BookingWelcomeEmail';
import { BookingModificationEmailProps } from '@/emails/BookingModificationEmail';
import { DoorCodeEmailProps } from '@/emails/DoorCodeEmail';

import { HostBookingModifiedEmailProps } from '@/emails/HostBookingModifiedEmail';
import { HostChargebackEmailProps } from '@/emails/HostChargebackEmail';
import { HostCheckoutConfirmedEmailProps } from '@/emails/HostCheckoutConfirmedEmail';
import { HostCleanerAssignedEmailProps } from '@/emails/HostCleanerAssignedEmail';
import { HostCleanerReportEmailProps } from '@/emails/HostCleanerReportEmail';
import { HostDamageReportEmailProps } from '@/emails/HostDamageReportEmail';
import { HostDoorCodeReminderEmailProps } from '@/emails/HostDoorCodeReminderEmail';
import { HostGuestCancelledEmailProps } from '@/emails/HostGuestCancelledEmail';
import { HostListingReadyEmailProps } from '@/emails/HostListingReadyEmail';
import { HostNoiseAlertEmailProps } from '@/emails/HostNoiseAlertEmail';
import { HostNotificationEmailProps } from '@/emails/HostNotificationEmail';
import { HostNoShowEmailProps } from '@/emails/HostNoShowEmail';
import { HostOnboardingWelcomeEmailProps } from '@/emails/HostOnboardingWelcomeEmail';
import { HostPrepSameDayEmailProps } from '@/emails/HostPrepSameDayEmail';
import { HostPrepThreeDayEmailProps } from '@/emails/HostPrepThreeDayEmail';
import { HostRefundAdjustmentEmailProps } from '@/emails/HostRefundAdjustmentEmail';
import { HostVerificationProgressEmailProps } from '@/emails/HostVerificationProgressEmail';
import { NoShowNotificationEmailProps } from '@/emails/NoShowNotificationEmail';
import { PaymentFailureEmailProps } from '@/emails/PaymentFailureEmail';
import { DepositReleaseEmailProps } from '@/emails/DepositReleaseEmail';
import { PreStay24hEmailProps } from '@/emails/PreStay24hEmail';
import { PreStayReminderEmailProps } from '@/emails/PreStayReminderEmail';
import { ReceiptEmailProps } from '@/emails/ReceiptEmail';
import { ReviewRequestEmailProps } from '@/emails/ReviewRequestEmail';
import { MidStayCheckInEmailProps } from '@/emails/MidStayCheckInEmail';
import { IssueReportConfirmationEmailProps } from '@/emails/IssueReportConfirmationEmail';
import { CheckoutReminderEmailProps } from '@/emails/CheckoutReminderEmail';
import { PostStayThankYouEmailProps } from '@/emails/PostStayThankYouEmail';
import { GuestRefundIssuedEmailProps } from '@/emails/GuestRefundIssuedEmail';
import { CancellationConfirmationEmailProps } from '@/emails/CancellationConfirmationEmail';
import { NoiseWarningEmailProps } from '@/emails/NoiseWarningEmail';
import { SystemEmailFailedEmailProps } from '@/emails/SystemEmailFailedEmail';
import { SystemStripeWebhookFailedEmailProps } from '@/emails/SystemStripeWebhookFailedEmail';
import { SystemBookingCreationFailedEmailProps } from '@/emails/SystemBookingCreationFailedEmail';
import { SystemCronSummaryEmailProps } from '@/emails/SystemCronSummaryEmail';
import { SystemMajorIssueEmailProps } from '@/emails/SystemMajorIssueEmail';
import { SystemCalendarSyncErrorEmailProps } from '@/emails/SystemCalendarSyncErrorEmail';
import { SystemPaymentExceptionEmailProps } from '@/emails/SystemPaymentExceptionEmail';
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

export function sampleHostDoorCodeReminderProps(): HostDoorCodeReminderEmailProps {
  return {
    hostName: 'Leo',
    propertyName: 'Summit Ridge Cabin',
    propertyLocation: 'Steamboat Springs, CO',
    guestName: 'Maya Bennett',
    arrivalWindow: 'Check-in opens today · 16:00 MT',
    lockDevice: 'Level Bolt + Keypad',
    timezone: 'Mountain Time',
    generatedAt: 'Sat · 08:05 MT',
    codeRotationTime: 'Auto-rotates at 12:00 MT',
    lockStatuses: [
      { label: 'Front door keypad', status: 'ready', note: 'Battery 82% · last sync 07:58 MT' },
      { label: 'Back patio keypad', status: 'in-progress', note: 'Firmware push finishing · ETA 08:20' },
      { label: 'BLE bridge', status: 'ready', note: 'Online · RSSI -58 dBm' },
    ],
    codes: [
      {
        label: 'Primary smart lock',
        code: '5539 ✱',
        validWindow: 'Active Feb 14 12:00 – Feb 18 11:00',
        channel: 'Auto-SMS to guest at 12:05',
        note: 'Matches guest door code email and admin dashboard',
      },
      {
        label: 'Cleaner turn code',
        code: '8142 ✱',
        validWindow: 'Thu 09:00 – Fri 13:00',
        channel: 'Cleaner app + Slack #ops-turnovers',
        note: 'Expires once primary code activates',
      },
      {
        label: 'Backup lockbox',
        code: '7711',
        validWindow: 'Always-on · replace weekly',
        note: 'Located behind propane cover · manual key inside',
      },
    ],
    checklist: [
      {
        label: 'Regenerate guest code',
        detail: 'Confirmed via Level API at 08:02',
        status: 'done',
      },
      {
        label: 'Push code to PMS + concierge SMS',
        detail: 'Queued for 12:05 broadcast',
        status: 'pending',
      },
      {
        label: 'Test keypad locally',
        detail: 'Ask Priya to enter code after walkthrough',
        status: 'attention',
      },
    ],
    fallbacks: [
      {
        label: 'Lockbox with analog key',
        detail: 'Behind propane cover · remove pad + re-arm after use',
        accessInfo: 'Code 7711',
      },
      {
        label: 'Garage entry keypad',
        detail: 'Shares code with back patio keypad once sync completes',
      },
    ],
    contacts: [
      { label: 'Ops desk', value: '+1 (970) 555-0101', note: '07:00–22:00 MT' },
      { label: 'Field tech', value: 'Nate Martinez · +1 (970) 555-0999', note: 'Hardware issues' },
      { label: 'Concierge', value: 'Slack #host-support', note: 'Guest comms + arrival support' },
    ],
    incidentNotes: 'If patio keypad firmware fails twice, fall back to garage keypad + manual door sweep.',
    attachments: [
      {
        label: 'Level lock dashboard',
        href: 'https://lock.bunks.com/devices/55612',
        description: 'Device status + override controls',
      },
      {
        label: 'Guest SMS thread',
        href: 'https://bunks.com/internal/sms/guest-12432',
        description: 'Confirm any ETA changes before blasting codes',
      },
    ],
  };
}

export function sampleHostDamageReportProps(): HostDamageReportEmailProps {
  return {
    hostName: 'Leo',
    propertyName: 'Summit Ridge Cabin',
    propertyLocation: 'Steamboat Springs, CO',
    guestName: 'Maya Bennett',
    incidentDate: 'Fri · Feb 15 · 21:40 MT',
    reportedBy: 'Maya (guest)',
    severity: 'medium',
    summary:
      'Guest reported a cracked glass panel on the coffee table after an accidental spill. No injuries. Photo evidence uploaded and cleaners notified to secure the area.',
    actionsTaken: [
      'Concierge messaged guest to move sharp shards into provided bin and keep kids away.',
      'Cleaner Priya scheduled to swing by 07:30 for temporary patch + debris sweep.',
    ],
    nextSteps: [
      {
        owner: 'Priya / Field Ops',
        action: 'Secure area + temp cover',
        due: 'Sat 07:30',
        status: 'in-progress',
        note: 'Carrying acrylic topper + vacuum to remove shards.',
      },
      {
        owner: 'Ali / Host comms',
        action: 'Send gentle damage acknowledgement to guest',
        due: 'Sat 09:00',
        status: 'pending',
      },
      {
        owner: 'Furniture vendor',
        action: 'Quote replacement glass panel',
        due: 'Mon 12:00',
        status: 'pending',
        note: 'Need photos + measurements from Priya dropbox before sending.',
      },
    ],
    affectedAreas: [
      {
        area: 'Living room coffee table',
        detail: 'Tempered glass inset cracked from center toward edge. Base + metal frame unaffected.',
        photos: [
          { label: 'Photo · overview', url: 'https://bunks.com/internal/photos/damage-8831/overview' },
          { label: 'Photo · close-up', url: 'https://bunks.com/internal/photos/damage-8831/closeup' },
        ],
      },
      {
        area: 'Rug',
        detail: 'Small stain (approx 4") from orange soda. Cleaner will attempt spot treatment.',
      },
    ],
    estimates: [
      { label: 'Replacement glass panel', amount: '$210.00', note: 'Summit Custom Glass · 3-day lead time' },
      { label: 'Cleaner overtime (Priya)', amount: '$45.00', note: 'Emergency call-out' },
    ],
    insurance: {
      claimId: 'CLM-2025-1182',
      hotline: '+1 (833) 555-0145',
      note: 'Not yet submitted to carrier; waiting on vendor invoice.',
    },
    contacts: [
      { label: 'Ops desk', value: '+1 (970) 555-0101', note: '07:00–22:00 MT' },
      { label: 'Furniture vendor', value: 'Summit Custom Glass · (970) 555-2222', note: 'Ask for Lila' },
      { label: 'Insurance liaison', value: 'Clara Ortiz · clara@bunks.com', note: 'Files claims + carrier follow-ups' },
    ],
    attachments: [
      {
        label: 'Guest incident form',
        href: 'https://bunks.com/internal/incidents/8831',
        description: 'Full questionnaire + photos',
      },
      {
        label: 'Cleaner Slack thread',
        href: 'https://slack.com/app_redirect?channel=ops-incidents&message=8831',
        description: 'Live updates from Priya',
      },
    ],
    escalationNote: 'If vendor cannot commit by Monday, reroute to Mountain Modern Rentals for rental coffee table.',
  };
}



export function sampleHostBookingModifiedProps(): HostBookingModifiedEmailProps {
  return {
    hostName: 'Ali',
    propertyName: 'Summit Ridge Cabin',
    guestName: 'Maya Bennett',
    bookingId: 12432,
    changeLoggedAt: 'Nov 30 · 09:42 MT',
    summary: 'Guest extended by one night, added infant, and requested baby gear rental.',
    stayDatesBefore: 'Feb 14 – Feb 18',
    stayDatesAfter: 'Feb 14 – Feb 19',
    calendarStatus: 'Calendar reopened Feb 19 for cleaners · Airbnb sync complete.',
    payoutImpact: [
      { label: 'New payout', value: '$2,320.00', helper: '+$200 vs prior total' },
      { label: 'Adjustments', value: '$180.00', helper: 'Baby gear handling' },
    ],
    changeItems: [
      {
        label: 'Checkout date',
        previous: 'Tue · Feb 18 · 10:00',
        updated: 'Wed · Feb 19 · 10:00',
        flag: 'dates',
        note: 'Cleaner window shifted to Wed noon.',
      },
      {
        label: 'Headcount',
        previous: '4 adults',
        updated: '4 adults + 1 infant',
        flag: 'headcount',
        note: 'Crib + high chair requested.',
      },
      {
        label: 'Total payout',
        previous: '$2,120.00',
        updated: '$2,320.00',
        flag: 'pricing',
      },
    ],
    tasks: [
      {
        label: 'Extend cleaner schedule',
        owner: 'Silverpeak Clean Co.',
        due: 'Today · 12:00',
        status: 'in-progress',
      },
      {
        label: 'Confirm baby gear delivery',
        owner: 'Priya / Ops',
        due: 'Today · 14:00',
        status: 'pending',
        note: 'Add infant bath kit to order.',
      },
    ],
    followUpNotes: 'Texting guest once crib photo uploaded to SMS thread.',
  };
}

export function sampleHostCleanerReportProps(): HostCleanerReportEmailProps {
  return {
    hostName: 'Ali',
    propertyName: 'Summit Ridge Cabin',
    cleanerName: 'Silverpeak Clean Co.',
    turnoverDate: 'Nov 30 · 11:00 MT',
    reportLoggedAt: 'Nov 30 · 12:15 MT',
    summary: 'Turnover complete; noted hot tub foam and broken lamp shade.',
    arrivalWindow: 'Next arrival Dec 2 · 16:00',
    nextGuest: 'Carson L. · 4 guests',
    issues: [
      {
        area: 'Hot tub',
        detail: 'Foam + film from overused bath bombs. Needs shock + rinse.',
        severity: 'attention',
        recommendation: 'Scheduled chemical balance at 14:30.',
        photoUrl: 'https://bunks.com/internal/photos/turnover-991/hot-tub',
      },
      {
        area: 'Primary bedroom lamp',
        detail: 'Fabric shade dented. Bulb intact.',
        severity: 'info',
        recommendation: 'Swap spare shade from storage closet before next arrival.',
      },
      {
        area: 'Pantry restock',
        detail: 'Coffee pods down to 6 sleeves.',
        severity: 'info',
      },
    ],
    supplyLevels: [
      { item: 'Laundry pods', status: 'stocked', note: 'Full Sam’s Club bucket on shelf.' },
      { item: 'Paper towels', status: 'low', note: '2 sleeves left—add to grocery order.' },
      { item: 'Spa towels', status: 'critical', note: 'Only 3 clean sets—run emergency wash.' },
    ],
    followUps: [
      {
        label: 'Replace lamp shade',
        owner: 'Priya / Ops',
        due: 'Dec 1 · 10:00',
        status: 'pending',
      },
      {
        label: 'Shock hot tub',
        owner: 'Nate / Field Ops',
        due: 'Nov 30 · 14:30',
        status: 'in-progress',
      },
    ],
    attachments: [
      { label: 'Turnover photo set', href: 'https://bunks.com/internal/photos/turnover-991', description: 'Before/after shots' },
    ],
  };
}

export function sampleHostNoiseAlertProps(): HostNoiseAlertEmailProps {
  return {
    hostName: 'Ali',
    propertyName: 'Summit Ridge Cabin',
    alertSource: 'Minut Sensor · Living room',
    detectedAt: 'Nov 29 · 22:18 MT',
    quietHours: '22:00 – 07:00 MT',
    decibelPeak: '87 dB peak · avg 78 dB',
    threshold: '65 dB',
    location: 'Living room / deck slider',
    currentStatus: 'Guest notified · monitoring',
    guestThreadUrl: 'https://bunks.com/admin/bookings/12432/guest-thread',
    actions: [
      {
        label: 'Send courtesy SMS',
        detail: 'Template #noise-1 already delivered to guest + CC concierge.',
        severity: 'info',
      },
      {
        label: 'Call guest if noise >10m',
        detail: 'Priya queued manual call if readings stay above 70 dB.',
        severity: 'warning',
      },
      {
        label: 'Alert security',
        detail: 'Only if peak exceeds 90 dB after midnight.',
        severity: 'critical',
      },
    ],
    timeline: [
      { time: '22:18', label: 'Minut alert fired', status: 'complete' },
      { time: '22:19', label: 'SMS sent to guest', status: 'sent' },
      { time: '22:25', label: 'Decibel trend dropping to 70 dB', status: 'pending', detail: 'Still above threshold—keep monitoring.' },
    ],
    contacts: [
      { label: 'Ops desk', value: '+1 (970) 555-0101', note: 'Escalations 24/7' },
      { label: 'Community security', value: '+1 (970) 555-0998', note: 'Provide property code 8821' },
    ],
    notes: 'If alert clears before 22:35, auto-close without security follow-up.',
  };
}

export function sampleHostCheckoutConfirmedProps(): HostCheckoutConfirmedEmailProps {
  return {
    hostName: 'Ali',
    propertyName: 'Summit Ridge Cabin',
    checkoutTime: 'Feb 18 · 09:54 MT',
    confirmationSource: 'Level smart lock + cleaner app',
    cleanerStatus: 'En route · ETA 10:20',
    lockStatus: 'Auto-locked 09:55 MT',
    nextArrival: 'Feb 21 · 16:00',
    metrics: [
      { label: 'Guests departed', value: '09:54 MT', helper: 'Smart lock event' },
      { label: 'Cleaning window', value: '10:30 – 13:30', helper: 'Silverpeak Clean Co.' },
      { label: 'Hot tub cycle', value: 'Scheduled', helper: '14:00 shock treatment' },
    ],
    inspection: [
      { label: 'Lock / alarm reset', status: 'clear', detail: 'Alarm armed via app.' },
      { label: 'Windows + sliders', status: 'monitor', detail: 'Deck slider left slightly ajar—cleaner closing.' },
      { label: 'Garage doors', status: 'clear' },
    ],
    tasks: [
      {
        label: 'Confirm driveway plow',
        owner: 'Ops desk',
        status: 'scheduled',
        note: 'Snow expected tonight · leave salt bin by entry.',
      },
      {
        label: 'Log minibar restock',
        owner: 'Priya',
        status: 'pending',
      },
    ],
    attachments: [
      { label: 'Smart lock event log', href: 'https://lock.bunks.com/devices/55612/logs', description: 'Raw Level events' },
    ],
    notes: 'Cleaner will confirm lamp replacement photo once onsite.',
  };
}

export function sampleHostCleanerAssignedProps(): HostCleanerAssignedEmailProps {
  return {
    hostName: 'Ali',
    propertyName: 'Summit Ridge Cabin',
    turnoverDate: 'Feb 18 · 10:30 – 13:30',
    guestDeparture: 'Feb 18 · 10:00',
    assignments: [
      {
        name: 'Priya Singh',
        company: 'Silverpeak Clean Co.',
        arrivalWindow: '10:30 – 13:30',
        status: 'confirmed',
        contact: '+1 (970) 555-0128',
        note: 'Will handle QA photos too.',
      },
      {
        name: 'Nate Martinez',
        company: 'Field Ops',
        arrivalWindow: '12:00 – 13:00',
        status: 'en-route',
        note: 'Hot tub + exterior sweep.',
      },
    ],
    prepItems: [
      { label: 'Stage Pack ’n Play', detail: 'Primary bedroom corner', status: 'in-progress' },
      { label: 'Restock firewood', detail: 'Add 4 bundles to deck box', status: 'needs-action' },
    ],
    escalationNote: 'Reply before 14:00 MT to swap cleaners without penalty.',
    attachments: [
      { label: 'Turnover run sheet', href: 'https://bunks.com/internal/runsheet/host-12432', description: 'Cleaner + concierge tasks' },
    ],
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

export function sampleHostNoShowProps(): HostNoShowEmailProps {
  return {
    hostName: 'Ali',
    propertyName: 'Summit Ridge Cabin',
    guestName: 'Sophie Lane',
    stayDates: 'Nov 24 – Nov 27',
    declaredAt: 'Nov 25 · 09:05 MT',
    detectionSource: 'Door code + cleaner check',
    retainedAmount: '$1,180.00',
    retentionLines: [
      { label: 'Nightly charges retained', amount: '$960.00', note: 'Per strict policy' },
      { label: 'Cleaning fee retained', amount: '$220.00' },
    ],
    calendarStatus: 'Calendar reopened Nov 25 evening',
    rebookWindow: 'Nov 25 – Nov 27',
    tasks: [
      {
        label: 'Call guest to confirm no arrival',
        detail: 'Left voicemail + email',
        owner: 'CX Desk',
        status: 'done',
      },
      {
        label: 'Push standby guest list',
        detail: 'Offer 30% discount for last-minute',
        owner: 'Sales pod',
        status: 'pending',
      },
    ],
    notes: 'If guest disputes charges, prep evidence bundle with lock logs + SMS thread.',
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

export function sampleHostChargebackProps(): HostChargebackEmailProps {
  return {
    hostName: 'Ali',
    propertyName: 'Summit Ridge Cabin',
    guestName: 'Cameron Diaz',
    disputeId: 'dp_3Q1xkDQp3fz3ncu11R',
    amount: '$2,480.00',
    replyBy: 'Dec 04 · 16:00 MT',
    processor: 'Stripe',
    reason: 'Service not as described',
    narrative: 'Guest claims property was “unclean” on arrival despite cleaner photos + signed checklist.',
    evidenceNeeded: [
      { label: 'Signed cleaner checklist', detail: 'Upload PDF or screenshot', status: 'attached' },
      { label: 'Arrival photos', detail: 'Living room + kitchen before guest entry', status: 'missing' },
      { label: 'Guest communication', detail: 'Screenshots from SMS + email thread', status: 'optional' },
    ],
    timeline: [
      { time: 'Nov 29 08:21', label: 'Stripe opened dispute', status: 'done' },
      { time: 'Nov 29 08:23', label: 'Finance paused payout', status: 'done' },
      { time: 'Dec 02 10:00', label: 'Evidence review', status: 'pending', detail: 'Need host photos before this review' },
    ],
    links: [
      { label: 'Stripe dispute dashboard', href: 'https://dashboard.stripe.com/disputes/dp_3Q1xkD', description: 'Upload evidence here' },
      { label: 'Guest SMS thread', href: 'https://bunks.com/admin/bookings/12881/messages', description: 'Use for timeline notes' },
    ],
    supportNote: 'Reply with photos or drop them in #finance-chargebacks before Dec 4.',
  };
}

export function sampleHostOnboardingWelcomeProps(): HostOnboardingWelcomeEmailProps {
  return {
    hostName: 'Devon',
    propertyName: 'Summit Ridge Cabin',
    accountManager: 'Priya Kapur',
    accountContact: 'priyaa@bunks.com · +1 (970) 555-0101',
    welcomeMessage: 'Thrilled to have you on board. We already ingested your photos and PMS exports, so we are days away from going live.',
    checklist: [
      { title: 'Sign hosting agreement', detail: 'DocuSign invite sent · takes 3 minutes', status: 'done' },
      { title: 'Connect Stripe payout', detail: 'Secure link shared in onboarding portal', status: 'in-progress' },
      { title: 'Upload insurance certificate', detail: 'Drag + drop into portal or reply to this email', status: 'pending' },
    ],
    resources: [
      { label: 'Onboarding portal', href: 'https://bunks.com/onboarding/devon', description: 'Task tracker + document uploads' },
      { label: 'Host playbook', href: 'https://bunks.com/resources/host-playbook.pdf', description: 'Policies + response times' },
    ],
    nextCall: 'Kickoff call · Dec 1 at 10:30 MT (Google Meet link in calendar invite)',
  };
}

export function sampleHostVerificationProgressProps(): HostVerificationProgressEmailProps {
  return {
    hostName: 'Devon',
    propertyName: 'Summit Ridge Cabin',
    expectedGoLive: 'Mid-December',
    tracks: [
      { label: 'Identity verification', status: 'approved', detail: 'Driver license + banking verified' },
      { label: 'Insurance review', status: 'in-review', detail: 'Carrier certificate uploaded · waiting on endorsement', owner: 'Ops compliance' },
      { label: 'Safety walkthrough', status: 'needs-info', detail: 'Missing updated CO detector photo', owner: 'Field ops' },
      { label: 'Listing QA', status: 'pending', detail: 'Copy + pricing adjustments queued', owner: 'Copy pod' },
    ],
    outstanding: [
      {
        label: 'Upload CO detector timestamped photo',
        description: 'Snap new photo showing install date and location',
        actionUrl: 'https://bunks.com/onboarding/tasks/co-detector',
        due: 'Dec 2',
      },
      {
        label: 'Confirm STR permit number',
        description: 'Reply with Steamboat Springs permit or request help filing',
        due: 'Dec 3',
      },
    ],
    approvedItems: ['Banking + payouts', 'Identity KYC', 'Photo ingest + AI enhancement'],
    notes: 'Once insurance endorsement lands we can schedule photographer for fresh exterior shots.',
  };
}

export function sampleHostListingReadyProps(): HostListingReadyEmailProps {
  return {
    hostName: 'Devon',
    propertyName: 'Summit Ridge Cabin',
    previewUrl: 'https://bunks.com/admin/listings/summit-ridge/preview',
    summary: 'We drafted your listing copy, pricing grid, and photo set based on the assets you provided. Take a pass and leave comments before we publish.',
    highlights: [
      { label: 'Headline + intro', detail: '“Alpine retreat with private spa + chef-ready kitchen”', badge: 'AI draft' },
      { label: 'House rules', detail: 'Pulled from onboarding doc, includes quiet hours + bear-proof trash' },
      { label: 'Guidebook links', detail: 'Dining, trail maps, spa partners pre-loaded', badge: 'New' },
    ],
    actions: [
      { label: 'Upload refreshed bunk room photos', description: 'Replace placeholders with your latest shoot', status: 'recommended' },
      { label: 'Verify pricing tiers', description: 'High/shoulder/low seasons pre-loaded from comps', status: 'optional' },
      { label: 'Approve copy + publish', description: 'Once you hit approve we’ll sync to Airbnb + direct', status: 'done' },
    ],
    photoStats: [
      { label: 'Total photos', value: '42', helper: '12 rooms covered' },
      { label: 'Hero shots', value: '6', helper: 'Sunset + spa' },
      { label: '360º tours', value: '2', helper: 'Living room + primary suite' },
    ],
    goLiveEta: '48 hours after approval',
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

export function sampleIssueReportConfirmationProps(): IssueReportConfirmationEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    ticketId: 'OPS-9482',
    submittedAt: 'Mon, Feb 17 · 21:14 MT',
    summary: 'Primary fireplace remote is unresponsive and the pilot light will not relight. We tried swapping batteries.',
    severity: 'medium',
    location: 'Great room · stone fireplace',
    etaMinutes: 25,
    assignedTo: 'Leo (Field Ops)',
    nextSteps: [
      'Ops lead Leo en route with replacement remote + ignition tool',
      'If relight fails, we will comp the patio heater rental',
    ],
    evidence: [
      { label: 'Photo', value: 'https://bunks.com/issues/OPS-9482/photo' },
      { label: 'Video', value: 'https://bunks.com/issues/OPS-9482/video' },
    ],
    support: {
      email: 'ops@bunks.com',
      phone: '+1 (970) 555-0901',
      concierge: '+1 (970) 555-0400',
      escalationNote: 'If you smell gas or see flame outside the firebox, call us and then dial 911.',
    },
    safetyContact: {
      label: 'On-site ops',
      value: '+1 (970) 555-0999',
    },
  };
}

export function sampleNoiseWarningProps(): NoiseWarningEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    detectedAt: 'Fri · 22:14 MT',
    quietHours: '22:00 – 08:00',
    alertReason: 'Our Minut sensor picked up a sustained 78 dB reading on the back deck.',
    location: 'back deck & hot tub area',
    decibelReading: '78 dB (threshold 70 dB) for 8 minutes',
    monitorType: 'Minut monitor · Deck slider',
    requestActions: [
      'Lower the music volume and keep voices to a conversational level outdoors.',
      'Close the sliders if you&apos;re hosting on the patio or move inside for the night.',
      'Reply to let us know once it&apos;s quiet so we can clear the alert.',
    ],
    guidelines: [
      { label: 'Deck & hot tub', detail: 'No amplified speakers outside after 22:00.' },
      { label: 'Windows & sliders', detail: 'Close them when using speakers late at night.' },
      { label: 'Driveway', detail: 'Please avoid idling or loud arrivals overnight.' },
    ],
    followUpWithin: '10 minutes',
    communityNote: 'Neighbors on Ridge Lane are close by—they text us quickly if it stays loud.',
    issueReportingUrl: 'https://bunks.com/support/issues/new',
    support: {
      email: 'ali@bunks.com',
      phone: '+1 (970) 555-0119',
      note: 'Text us once things are quiet and we’ll mark the alert resolved.',
    },
  };
}

export function sampleBookingModificationProps(): BookingModificationEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    bookingId: 48291,
    updatedAt: 'Tue · 13:40 MT',
    previousDates: 'Fri 14 Feb – Tue 18 Feb',
    newDates: 'Sat 15 Feb – Wed 19 Feb',
    nightsSummary: '4 nights · Feb 15 – Feb 19',
    headcount: '5 guests + 1 infant',
    changeReason: 'Flight moved by 24 hours due to weather.',
    checkInWindow: 'Check-in window 16:00 – 20:00 MT',
    manageBookingUrl: 'https://bunks.com/bookings/48291',
    changeItems: [
      {
        label: 'Stay dates',
        previous: 'Feb 14 – Feb 18',
        updated: 'Feb 15 – Feb 19',
        note: 'We shifted cleaners + hot tub service to align with your new checkout.',
      },
      {
        label: 'Guests',
        previous: '4 adults',
        updated: '5 adults + 1 infant',
        note: 'We’ll stage the Pack ’n Play and extra robe set.',
      },
      {
        label: 'Airport transfer',
        previous: 'Friday 14:00 pick-up',
        updated: 'Saturday 14:00 pick-up',
      },
    ],
    chargeAdjustments: [
      {
        label: 'Night removed (Fri)',
        amount: '$520.00',
        type: 'credit',
        note: 'Refunded to your original payment method.',
      },
      {
        label: 'Night added (Tue)',
        amount: '$540.00',
        type: 'charge',
        note: 'Includes weekend differential.',
      },
      {
        label: 'Infant gear package',
        amount: '$45.00',
        type: 'charge',
      },
    ],
    financialSummary: {
      label: 'New balance due',
      amount: '$65.00',
      note: 'We’ll auto-charge the card on file within the next hour unless you reply with another preference.',
    },
    tasks: [
      {
        label: 'Confirm new flight arrival',
        detail: 'Reply with airline + ETA so we can update the driver manifest.',
        due: 'Today',
        status: 'new',
      },
      {
        label: 'Share infant sleep preferences',
        detail: 'We can pre-stage blackout curtains + white noise.',
        status: 'in-progress',
      },
    ],
    nextSteps: [
      'Let us know if airport transfer needs a car seat.',
      'Update us if any other guests join so we can prep linens.',
    ],
    support: {
      email: 'ali@bunks.com',
      phone: '+1 (970) 555-0119',
      note: 'We answer in under 5 minutes during active stays.',
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

export function sampleNoShowNotificationProps(): NoShowNotificationEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    bookingId: 48291,
    stayDates: 'Feb 15 – Feb 19',
    reportedAt: 'Sat · 23:45 MT',
    checkInWindow: '16:00 – 22:00 MT',
    arrivalStatus: 'No door unlock activity detected + cleaners confirmed vacant',
    charges: [
      { label: 'First night retained', amount: '$520.00', note: 'Per flexible policy inside 24h' },
      { label: 'Cleaning prep', amount: '$180.00', note: 'Vendors already dispatched' },
    ],
    totalRetained: '$700.00',
    retentionNote: 'We’ll release any remaining security deposit within 24h.',
    nextSteps: [
      { label: 'Still arriving?', detail: 'Text us with an ETA before 02:00 MT to see if we can reopen access.' },
      { label: 'Need to rebook?', detail: 'We can apply a 20% credit if you choose new dates this week.' },
    ],
    rebookOffer: {
      headline: 'Rebooking credit available',
      description: 'Apply 20% toward a future Bunks stay when you rebook within 30 days.',
      ctaLabel: 'Browse new dates',
      ctaUrl: 'https://bunks.com/properties',
      note: 'Credit applies automatically once you sign in.',
    },
    support: {
      email: 'ops@bunks.com',
      phone: '+1 (970) 555-0101',
      note: 'We respond within minutes during arrival windows.',
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

export function sampleDepositReleaseProps(): DepositReleaseEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    bookingId: 48291,
    stayDates: 'Feb 15 – Feb 19',
    releasedAt: 'Wed · 10:05 MT',
    depositAmount: '$500.00',
    method: 'Visa ending 4242',
    expectedTimeline: '3–5 business days',
    descriptor: 'Bunks*DepositRelease',
    adjustments: [
      { label: 'Hot tub cover latch', amount: '$45.00', note: 'Repair scheduled with vendor' },
    ],
    note: 'If you see a pending hold lingering beyond 5 days, share a screenshot and we’ll escalate with Stripe.',
    tips: [
      'Contact your bank if the original hold never fell off—they can manually release it with this receipt.',
      'Need documentation for travel insurance? Reply and we’ll send a stamped PDF.',
    ],
    support: {
      email: 'ops@bunks.com',
      phone: '+1 (970) 555-0101',
      note: 'Share booking ID 48291 when you call.',
    },
  };
}

export function samplePostStayThankYouProps(): PostStayThankYouEmailProps {
  return {
    guestName: 'Maya',
    propertyName: 'Summit Ridge Cabin',
    stayDates: 'Feb 14 – Feb 18, 2025',
    heroCopy: 'If there’s anything we can improve for next time, just reply to this email—we read every note.',
    memoryHighlights: [
      {
        title: 'Bluebird powder',
        detail: 'Your snowcat charter photos had the whole ops team jealous.',
        note: 'We saved the media gallery link below in case you need it again.',
      },
      {
        title: 'Après chef dinner',
        detail: 'Chef Alonzo said the alpine fondue showdown is now a Thursday tradition.',
      },
    ],
    futureStayOffer: {
      headline: 'Take 15% off your next stay',
      description: 'Applies to any Bunks property booked in the next 6 months.',
      code: 'MAYA15',
      expiresOn: 'May 31, 2025',
      ctaLabel: 'Browse homes',
      ctaUrl: 'https://bunks.com/properties',
    },
    referral: {
      headline: 'Share the cabin magic',
      reward: 'You + a friend each get $250 travel credit',
      detail: 'Send them your link and we’ll apply it automatically at booking.',
      ctaLabel: 'Grab referral link',
      ctaUrl: 'https://bunks.com/referrals',
    },
    upcomingReasons: [
      {
        title: 'Spring hot springs week',
        date: 'Apr 7 – 14',
        description: 'Private soak reservations + wildflower hikes in the valley.',
        ctaLabel: 'Hold dates',
        ctaUrl: 'https://bunks.com/trips/hotsprings',
      },
      {
        title: 'Fourth of July fireworks from the ridge',
        date: 'Jul 3 – 6',
        description: 'Limited availability · launch deck access with champagne toast.',
      },
    ],
    housekeepingFollowUp: [
      'Let us know if any personal items were left behind—we can ship them same day.',
      'Text photos of any wear & tear so we can log it before the next stay.',
    ],
    photoGalleryUrl: 'https://bunks.com/gallery/booking-123',
    reviewUrl: 'https://bunks.com/review/summit-ridge?booking=123',
    support: {
      email: 'hello@bunks.com',
      phone: '+1 (970) 555-0119',
      concierge: '+1 (970) 555-0901',
      note: 'We answer post-stay questions 07:00–22:00 MT every day.',
    },
    hostSignature: {
      name: 'Ali Rahman',
      title: 'Guest Experience Lead',
      headshotUrl: 'https://bunks.com/static/hosts/ali.png',
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

export function sampleSystemEmailFailedProps(): SystemEmailFailedEmailProps {
  return {
    incidentId: 'PM-88421',
    environment: 'production',
    occurredAt: 'Nov 22 · 08:14 MT',
    recipient: 'maya.bennett@example.com',
    originalSubject: 'Your stay receipt from Bunks',
    stream: 'outbound',
    bounceType: 'HardBounce',
    bounceSubtype: 'MailboxNotFound',
    description: 'smtp; 550 5.1.1 The email account that you tried to reach does not exist.',
    suppressionReason: 'Postmark suppressed further sends until address is fixed.',
    messageId: '0a2f1c29-43b2-4f30-9ac6-b79aa0c30af8',
    triggeredBy: 'postmark-webhook@bunks.com',
    actionItems: [
      {
        label: 'Verify recipient email',
        detail: 'Check booking record #12345 and confirm the guest email on file is correct.',
        owner: 'CX Team',
        severity: 'high',
      },
      {
        label: 'Resend receipt manually',
        detail: 'Once the correct address is confirmed, resend via admin → Emails and note the ticket.',
        owner: 'Ops Desk',
        severity: 'medium',
      },
    ],
    metadata: [
      { label: 'Booking', value: '#12345', hint: 'Stripe PI: pi_3Olxa8Qp3', href: 'https://app.bunks.test/admin/bookings/12345' },
      { label: 'Template', value: 'receipt', hint: 'sendReceiptEmail' },
      { label: 'Attempt', value: '1 of 3 (auto-retry disabled)', hint: 'Hard bounces do not retry' },
    ],
    relatedLogsUrl: 'https://app.postmarkapp.com/activity?message=0a2f1c29',
    escalationNotes: 'If this guest still needs their receipt today, follow up by SMS once a correct email is confirmed.',
  };
}

export function sampleSystemStripeWebhookFailedProps(): SystemStripeWebhookFailedEmailProps {
  return {
    incidentId: 'STRIPE-WH-7712',
    environment: 'production',
    occurredAt: 'Nov 22 · 09:31 MT',
    endpoint: 'https://api.bunks.com/api/stripe/webhook',
    eventId: 'evt_1Q0xQKQp3fz3ncu1rL7IR9jq',
    eventType: 'payment_intent.succeeded',
    attemptNumber: 3,
    maxAttempts: 3,
    lastResponseCode: '500 (Next.js route exception)',
    errorSummary: 'Prisma timeout while loading booking + property data',
    suppressionRisk: 'Stripe will pause deliveries if another failure occurs in the next hour.',
    actionItems: [
      {
        label: 'Replay event from Stripe dashboard',
        detail: 'After patching the handler, replay evt_1Q0xQK... from Developers → Events.',
        severity: 'high',
        owner: 'Payments squad',
      },
      {
        label: 'Patch webhook handler',
        detail: 'Guard against missing booking data and short-circuit Postmark calls.',
        severity: 'medium',
        owner: 'Ali',
      },
    ],
    metadata: [
      {
        label: 'Stripe event link',
        value: 'View in dashboard',
        href: 'https://dashboard.stripe.com/events/evt_1Q0xQKQp3fz3ncu1rL7IR9jq',
        hint: 'Requires prod credentials',
      },
      {
        label: 'Booking lookup',
        value: '#12345',
        href: 'https://app.bunks.test/admin/bookings/12345',
      },
      {
        label: 'Message stream impact',
        value: 'Guest confirmations on hold',
        hint: 'Host + guest emails wait on this handler',
      },
    ],
    payloadSnippet: {
      title: 'payment_intent.succeeded payload',
      lines: [
        '{',
        '  "id": "pi_3Q0xJmQp3fz3ncu11YlKfI6n",',
        '  "object": "payment_intent",',
        '  "amount_received": 284000,',
        '  "metadata": { "bookingId": "12345" }',
        '}',
      ],
    },
    dashboards: [
      { label: 'Postmark log search', href: 'https://app.postmarkapp.com/activity?tag=stripe-webhook' },
      { label: 'Vercel logs', href: 'https://vercel.com/bunks/app/logs?query=stripeWebhook' },
    ],
    escalationNotes: 'If this remains red for >30 min, inform finance so they can reconcile payouts manually.',
  };
}

export function sampleSystemBookingCreationFailedProps(): SystemBookingCreationFailedEmailProps {
  return {
    incidentId: 'BOOK-FAIL-9921',
    environment: 'production',
    occurredAt: 'Nov 22 · 09:58 MT',
    request: {
      endpoint: 'https://api.bunks.com/api/bookings',
      method: 'POST',
      statusCode: '500 Internal Server Error',
      durationMs: 1842,
      correlationId: 'req_01HHKQK6KYZ9',
      remoteIp: '52.31.44.102',
    },
    bookingReference: 'pending booking for pi_3Q0xJm...',
    guestName: 'Maya Bennett',
    propertyName: 'Summit Ridge Cabin',
    errorSummary: 'Prisma transaction failed when inserting booking + ancillary items',
    rootCauseHint: 'Unique constraint on booking slug indicates duplicate creation attempt',
    actionItems: [
      {
        label: 'Verify Stripe payment intent state',
        detail: 'Confirm pi_3Q0xJm is captured and not refunded automatically.',
        severity: 'critical',
        owner: 'Payments squad',
      },
      {
        label: 'Replay booking creation manually',
        detail: 'Use admin → Bookings → “Create from payment intent” to attach metadata.',
        severity: 'high',
        owner: 'CX Desk',
      },
      {
        label: 'Patch booking API',
        detail: 'Add guard around duplicate booking slug and ensure ancillary transaction is atomic.',
        severity: 'medium',
        owner: 'Platform pod',
      },
    ],
    metadata: [
      {
        label: 'Stripe payment intent',
        value: 'pi_3Q0xJmQp3fz3ncu11YlKfI6n',
        href: 'https://dashboard.stripe.com/payments/pi_3Q0xJmQp3fz3ncu11YlKfI6n',
        hint: 'Verify capture + metadata',
      },
      {
        label: 'Guest email',
        value: 'maya.bennett@example.com',
      },
      {
        label: 'Retry policy',
        value: 'Auto retry disabled after 1 hard failure',
        hint: 'Manual intervention required',
      },
    ],
    payloadSnippet: {
      title: 'booking payload',
      lines: [
        '{',
        '  "guestName": "Maya Bennett",',
        '  "guestEmail": "maya.bennett@example.com",',
        '  "propertyId": 12,',
        '  "checkInDate": "2025-02-14",',
        '  "checkOutDate": "2025-02-18"',
        '}',
      ],
    },
    dashboards: [
      { label: 'Booking pipeline dashboard', href: 'https://grafana.bunks.internal/d/booking-pipeline' },
      { label: 'Sentry issue', href: 'https://sentry.io/organizations/bunks/issues/123456789' },
    ],
    escalationNotes: 'If manual creation fails, refund payment intent within 15 minutes to avoid double charges.',
  };
}

export function sampleSystemCronSummaryProps(): SystemCronSummaryEmailProps {
  return {
    runId: 'CRON-2025-11-22-0600',
    cronName: 'Guest lifecycle cron',
    environment: 'production',
    startedAt: 'Nov 22 · 06:00 MT',
    completedAt: 'Nov 22 · 06:02 MT',
    duration: '1m 47s total runtime',
    status: 'degraded',
    summary: 'Reminder + review jobs completed with minor queue backlog warnings.',
    summaryDetail: 'Door-code digest skipped (no qualifying arrivals) · review queue drained except for 14 escalations.',
    metrics: [
      { label: 'Bookings evaluated', value: '148', helper: 'Across 6 properties' },
      { label: 'Emails sent', value: '92', helper: '48h + 24h reminders, checkout, reviews' },
      { label: 'Failures', value: '1', helper: 'Checkout reminder missing guest email' },
      { label: 'Retries queued', value: '3', helper: 'Auto retry at +15m' },
    ],
    jobResults: [
      {
        jobName: '48h pre-stay reminder',
        window: 'Arrivals · Nov 24',
        attempted: 34,
        sent: 32,
        failed: 0,
        skipped: 2,
        duration: '32s',
        notes: 'Two bookings cancelled overnight',
      },
      {
        jobName: '24h pre-stay reminder',
        window: 'Arrivals · Nov 23',
        attempted: 28,
        sent: 28,
        failed: 0,
        skipped: 0,
        duration: '24s',
        severity: 'info',
        notes: 'All sends healthy',
      },
      {
        jobName: 'Checkout reminder',
        window: 'Departures · Nov 23',
        attempted: 22,
        sent: 21,
        failed: 1,
        skipped: 0,
        duration: '19s',
        severity: 'warning',
        notes: 'Guest email missing on booking #12401',
      },
      {
        jobName: 'Post-stay review nudges',
        window: 'Departures · Nov 22',
        attempted: 18,
        sent: 11,
        failed: 0,
        skipped: 7,
        duration: '15s',
        notes: '7 bookings already reviewed in app',
      },
      {
        jobName: 'Door code refresh',
        window: 'Arrivals · Nov 22',
        attempted: 6,
        sent: 0,
        failed: 0,
        skipped: 6,
        duration: '3s',
        severity: 'info',
        notes: 'No new codes required',
      },
    ],
    incidents: [
      {
        title: 'Missing guest email · booking #12401',
        detail: 'Checkout reminder skipped because guest email is null. Update contact record or suppress future sends.',
        owner: 'CX Desk',
        severity: 'medium',
      },
      {
        title: 'Review queue trending high',
        detail: '14 reviews outstanding >48h. Concierge SMS follow-up recommended before noon.',
        owner: 'Guest Experience',
        severity: 'high',
      },
    ],
    backlog: [
      {
        label: 'Review queue',
        count: '14 pending',
        helper: 'SLA 24h · +4 vs yesterday',
        trend: 'up',
      },
      {
        label: 'Issue follow-ups',
        count: '3 open',
        helper: 'Needs manual summary send',
        trend: 'flat',
      },
    ],
    followUpLinks: [
      {
        label: 'Open run in Grafana',
        href: 'https://grafana.bunks.internal/d/cron-lifecycle',
        description: 'Logs + timings',
      },
      {
        label: 'Queue triage board',
        href: 'https://app.bunks.test/admin/queues',
        description: 'Assign review follow-ups',
      },
    ],
    operatorNotes: 'Auto-retry for review send error scheduled at 06:17 MT. Ping engineering if second attempt fails.',
    nextRunWindow: 'Every 6 hours · next kickoff 12:00 MT',
  };
}

export function sampleSystemMajorIssueProps(): SystemMajorIssueEmailProps {
  return {
    incidentId: 'ISSUE-4472',
    severity: 'critical',
    category: 'safety',
    environment: 'production',
    reportedAt: 'Nov 22 · 07:41 MT',
    slaCountdown: 'Resolve within 30m',
    bookingRef: '#12401 (4-night stay)',
    propertyName: 'Summit Ridge Cabin',
    propertyLocation: 'Steamboat Springs, CO',
    guestName: 'Maya Bennett',
    issueSummary: 'Carbon monoxide alarm triggered in great room',
    issueDetail: 'Guest reported beeping plus mild headache; they opened windows and stepped outside.',
    immediateImpact: 'Guests relocated to driveway; property offline until levels cleared.',
    statusLabel: 'Evacuation complete',
    actionItems: [
      {
        label: 'Dispatch on-site safety team',
        detail: 'Send Leo + backup with detector to confirm readings and ventilate the home.',
        owner: 'Field Ops',
        severity: 'critical',
        etaMinutes: 12,
      },
      {
        label: 'Coordinate guest relocation',
        detail: 'Hold spare property Aspen Overlook and arrange rideshare vouchers.',
        owner: 'Guest Experience',
        severity: 'high',
        etaMinutes: 20,
      },
      {
        label: 'Notify fire department hotline',
        detail: 'Share access instructions and confirm windows unlocked.',
        owner: 'Safety Desk',
        severity: 'high',
        etaMinutes: 5,
      },
    ],
    metadata: [
      {
        label: 'Sensor ID',
        value: 'SR-GR-CO-09',
        hint: 'Last calibrated Oct 12, 2025',
      },
      {
        label: 'Current booking value',
        value: '$2,480.00',
      },
      {
        label: 'Support thread',
        value: 'Ops ticket OPS-5532',
        href: 'https://app.bunks.test/issues/OPS-5532',
      },
    ],
    timeline: [
      {
        time: '07:41',
        label: 'Guest reported alarm via concierge SMS',
        detail: 'Triggered after fireplace relight attempt',
        status: 'complete',
      },
      {
        time: '07:44',
        label: 'Guests evacuated to driveway',
        detail: 'Provided blankets from gear closet',
        status: 'complete',
      },
      {
        time: '07:48',
        label: 'Ops dispatch en route',
        status: 'in-progress',
      },
      {
        time: '07:52',
        label: 'Fire department notified',
        status: 'pending',
      },
    ],
    responders: [
      {
        name: 'Leo Martinez',
        role: 'Field Ops Lead',
        eta: '12m',
        contact: '+1 (970) 555-0999',
        assignment: 'On-site sweep + ventilation',
      },
      {
        name: 'Priya Desai',
        role: 'Guest Experience',
        eta: 'Now',
        contact: 'Slack #cx-warroom',
        assignment: 'Relocation + stipend',
      },
    ],
    attachments: [
      {
        label: 'Guest video evidence',
        href: 'https://bunks.com/issues/OPS-5532/video',
        description: '30-second clip showing detector lights',
      },
      {
        label: 'Sensor telemetry',
        href: 'https://grafana.bunks.internal/d/safety?panel=CO-summit',
        description: 'Live ppm chart',
      },
    ],
    dashboards: [
      { label: 'Safety incident board', href: 'https://linear.app/bunks/team/OPS/all-issues' },
      { label: 'Live property cams', href: 'https://cameras.bunks.internal/summit-ridge' },
    ],
    escalationNotes: 'If ppm > 20 after venting, move guests permanently and file insurance notice within 2 hours.',
  };
}

export function sampleSystemCalendarSyncErrorProps(): SystemCalendarSyncErrorEmailProps {
  return {
    incidentId: 'ICAL-7712',
    environment: 'production',
    propertyName: 'Summit Ridge Cabin',
    propertyLocation: 'Steamboat Springs, CO',
    channel: 'Airbnb',
    occurredAt: 'Nov 22 · 08:05 MT',
    statusLabel: 'Retry queued',
    summary: 'Airbnb iCal feed returned 410 Gone for the last 2 pulls so inventory changes are not syncing.',
    summaryDetail: 'Calendar diff skipped 3 blocks—double-booking risk for overlapping requests.',
    snapshot: [
      { label: 'Missed imports', value: '3', helper: 'Past 2 hours', status: 'error' },
      { label: 'Next arrivals', value: '5', helper: 'Inside 72h', status: 'warning' },
      { label: 'Auto retries left', value: '2', helper: 'Runs every 15m', status: 'warning' },
    ],
    actionItems: [
      {
        label: 'Refresh Airbnb iCal token',
        detail: 'Generate new feed link from Airbnb dashboard and update property integration settings.',
        owner: 'Distribution',
        severity: 'high',
        etaMinutes: 10,
      },
      {
        label: 'Manually import latest calendar',
        detail: 'Download .ics and upload through admin → Calendar → “Upload ICS snapshot”.',
        owner: 'Ops Desk',
        severity: 'medium',
        etaMinutes: 15,
      },
      {
        label: 'Hold instant booking on Airbnb',
        detail: 'Toggle “request to book” until sync success is confirmed.',
        owner: 'Channel Manager',
        severity: 'medium',
      },
    ],
    feedIssues: [
      {
        platform: 'Airbnb iCal',
        feedUrl: 'https://www.airbnb.com/calendar/ical/12345.ics',
        lastSuccess: 'Nov 22 · 06:45 MT',
        failureWindow: '07:00 – 08:00 MT',
        errorCode: '410',
        errorDetail: '410 Gone · Airbnb rotated feed token',
        replayHref: 'https://app.bunks.test/admin/properties/12/feeds/airbnb/replay',
      },
    ],
    metadata: [
      {
        label: 'Property slug',
        value: 'summit-ridge-cabin',
      },
      {
        label: 'Channel manager job',
        value: 'job_01HHMP4CE5K5',
        href: 'https://grafana.bunks.internal/d/channel-sync?var=job=job_01HHMP4CE5K5',
      },
      {
        label: 'Next automated retry',
        value: '08:20 MT',
      },
    ],
    impactedBookings: [
      {
        guestName: 'Noah Patel',
        stayDates: 'Nov 24 – Nov 27',
        status: 'double-booked-risk',
        note: 'Airbnb pending request overlaps with direct booking #12420',
      },
      {
        guestName: 'Carson Lee',
        stayDates: 'Dec 1 – Dec 5',
        status: 'pending-review',
        note: 'Awaiting manual confirmation once feed restored',
      },
    ],
    dashboards: [
      { label: 'iCal monitor', href: 'https://grafana.bunks.internal/d/ical-health' },
      { label: 'Property calendar', href: 'https://app.bunks.test/admin/properties/12/calendar' },
    ],
    escalationNotes: 'If second retry fails, disable Airbnb channel for this property and notify host with replacement availability.',
  };
}

export function sampleSystemPaymentExceptionProps(): SystemPaymentExceptionEmailProps {
  return {
    incidentId: 'PAY-EX-9920',
    environment: 'production',
    anomalyType: 'Partial capture mismatch',
    severityLabel: 'Critical',
    occurredAt: 'Nov 22 · 10:32 MT',
    summary: 'Stripe shows a captured payment intent but the guest invoice reflects two pending holds and host payout is paused.',
    summaryDetail: 'Finance queue flagged duplicate charges plus missing ledger entry for the second capture.',
    bookingRef: '#12432',
    guestName: 'Noah Patel',
    propertyName: 'Summit Ridge Cabin',
    propertyLocation: 'Steamboat Springs, CO',
    paymentMethod: 'Visa •• 1881',
    paymentAmount: '$2,840.00',
    processor: 'Stripe · acct_1NM2...',
    metrics: [
      { label: 'Captures', value: '2', helper: 'Expected 1', status: 'critical' },
      { label: 'Held payout', value: '$1,420.00', helper: 'Host remittance', status: 'warning' },
      { label: 'Age', value: '26m', helper: 'Since anomaly detected', status: 'warning' },
    ],
    actionItems: [
      {
        label: 'Void duplicate charge',
        detail: 'Use Stripe dashboard → Payments → pi_3Q0y... to void the pending capture before settlement.',
        owner: 'Payments squad',
        severity: 'critical',
        followUpHref: 'https://dashboard.stripe.com/payments/pi_3Q0y',
        etaMinutes: 10,
      },
      {
        label: 'Verify guest statement credit',
        detail: 'Email/SMS guest once hold released; attach receipt screenshot.',
        owner: 'CX Desk',
        severity: 'high',
        etaMinutes: 20,
      },
      {
        label: 'Refresh payout batch',
        detail: 'After ledger is balanced, unpause host payout via admin → Finance → Releases.',
        owner: 'Finance Ops',
        severity: 'warning',
      },
    ],
    impactedFlows: [
      {
        label: 'Guest card charge',
        amount: '$2,840.00',
        stream: 'guest_charge',
        status: 'held',
        note: 'Stripe still lists two pending rows; second should be voided.',
      },
      {
        label: 'Host payout',
        amount: '$1,420.00',
        stream: 'host_payout',
        status: 'requires-review',
        note: 'Payout paused until duplicate resolved.',
      },
      {
        label: 'Service fees',
        amount: '$120.00',
        stream: 'fees',
        status: 'manual',
        note: 'Finance to adjust ledger once capture corrected.',
      },
    ],
    ledgerAdjustments: [
      {
        label: 'Guest charge reversal',
        amount: '$1,420.00',
        direction: 'credit',
        note: 'Void duplicate pending capture',
      },
      {
        label: 'Host payout hold',
        amount: '$1,420.00',
        direction: 'debit',
        note: 'Auto-hold until ledger matches Stripe',
      },
      {
        label: 'Service fee adjustment',
        amount: '$60.00',
        direction: 'credit',
        note: 'Half of fee auto-refunded until guest confirms',
      },
    ],
    metadata: [
      {
        label: 'Payment intent',
        value: 'pi_3Q0yXyQp3fz3ncu1uQI1k8hf',
        href: 'https://dashboard.stripe.com/payments/pi_3Q0yXyQp3fz3ncu1uQI1k8hf',
        hint: 'Captured · needs manual void',
      },
      {
        label: 'Charge IDs',
        value: 'ch_3Q0yXy... · ch_3Q0yXz...',
      },
      {
        label: 'Finance ticket',
        value: 'FIN-2841',
        href: 'https://linear.app/bunks/issue/FIN-2841',
      },
    ],
    timeline: [
      {
        time: '10:04',
        label: 'Stripe webhook delivered',
        detail: 'payment_intent.succeeded fired for pi_3Q0y...',
        status: 'complete',
      },
      {
        time: '10:06',
        label: 'Second capture attempted',
        detail: 'Retry job retried confirmation despite capture success',
        status: 'complete',
      },
      {
        time: '10:22',
        label: 'Finance anomaly detector flagged issue',
        detail: 'Duplicate charges + payout pause created',
        status: 'in-progress',
      },
      {
        time: '10:32',
        label: 'Ops notified',
        status: 'pending',
      },
    ],
    dashboards: [
      { label: 'Stripe payment dashboard', href: 'https://dashboard.stripe.com/payments?status=requires_action' },
      { label: 'Finance ledger monitor', href: 'https://grafana.bunks.internal/d/finance-ledger' },
    ],
    attachments: [
      {
        label: 'Guest invoice screenshot',
        href: 'https://bunks.com/admin/finance/invoices/12432',
        description: 'Shows duplicate pending charges',
      },
    ],
    escalationNotes: 'If duplicate hold is not voided within 45 minutes, alert finance leadership and consider comping fees.',
  };
}
