import { BookingConfirmationEmailProps } from '@/emails/BookingConfirmationEmail';
import { DoorCodeEmailProps } from '@/emails/DoorCodeEmail';
import { HostGuestCancelledEmailProps } from '@/emails/HostGuestCancelledEmail';
import { HostNotificationEmailProps } from '@/emails/HostNotificationEmail';
import { HostRefundAdjustmentEmailProps } from '@/emails/HostRefundAdjustmentEmail';
import { CheckoutReminderEmailProps } from '@/emails/CheckoutReminderEmail';
import { GuestRefundIssuedEmailProps } from '@/emails/GuestRefundIssuedEmail';
import { CancellationConfirmationEmailProps } from '@/emails/CancellationConfirmationEmail';
import { PaymentLinkEmailProps } from '@/emails/PaymentLinkEmail';
import { CANCELLATION_POLICY } from '@/data/policies';
import { SUPPORT_EMAIL } from '@/lib/contact';
import { CHECKOUT_CHECKLIST } from '@/emails/checkoutChecklist';
import { mapsUrlFor } from '@/lib/privatePropertyDetails';

// Admin → Emails previews and sample sends. Made-up address, codes and Wi-Fi: samples can be
// emailed to any address, so never use a real home's details here.
const SAMPLE_ADDRESS = '123 Example Street, Steamboat Springs, CO 80487';

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
    cancellationPolicy: CANCELLATION_POLICY.summary,
    supportEmail: SUPPORT_EMAIL,
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

export function sampleDoorCodeProps(): DoorCodeEmailProps {
  return {
    guestFirstName: 'Taylor',
    propertyName: 'Downtown Steamboat Luxury Townhome',
    arrivalHeadline: 'See you tomorrow',
    checkIn: 'Sun, February 14 · from 3:00 PM',
    checkOut: 'Thu, February 18 · by 10:00 AM',
    address: SAMPLE_ADDRESS,
    mapsUrl: mapsUrlFor(SAMPLE_ADDRESS),
    codeLabel: 'Lockbox code',
    doorCode: '1234',
    entrySteps: [
      { title: 'Garage code', detail: '5678' },
      { title: 'Ski locker', detail: 'Locker 36 · code 2222' },
    ],
    parkingInfo: [{ title: 'Where to park', detail: 'Two spaces in the garage under the unit.' }],
    wifi: { network: 'Bunks-Guest', password: 'sample-password' },
    guideUrl: 'https://www.bunks.com/api/guides/steamboat-downtown-townhome/guide?ref=K7Q2M',
    tripUrl: 'https://www.bunks.com/my-trips/K7Q2M/essential',
    bookingReference: 'K7Q2M',
    supportEmail: SUPPORT_EMAIL,
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
