import React from 'react';
import fs from 'node:fs/promises';
import path from 'node:path';

import { renderEmail } from '../src/lib/email/renderEmail';
import { BookingConfirmationEmail } from '../src/emails/BookingConfirmationEmail';
import { BookingWelcomeEmail } from '../src/emails/BookingWelcomeEmail';
import { HostGuestCancelledEmail } from '../src/emails/HostGuestCancelledEmail';
import { HostNotificationEmail } from '../src/emails/HostNotificationEmail';
import { HostRefundAdjustmentEmail } from '../src/emails/HostRefundAdjustmentEmail';
import { HostPrepThreeDayEmail } from '../src/emails/HostPrepThreeDayEmail';
import { DoorCodeEmail } from '../src/emails/DoorCodeEmail';
import { MidStayCheckInEmail } from '../src/emails/MidStayCheckInEmail';
import { CheckoutReminderEmail } from '../src/emails/CheckoutReminderEmail';
import { GuestRefundIssuedEmail } from '../src/emails/GuestRefundIssuedEmail';
import { CancellationConfirmationEmail } from '../src/emails/CancellationConfirmationEmail';
import { PaymentFailureEmail } from '../src/emails/PaymentFailureEmail';
import { PreStayReminderEmail } from '../src/emails/PreStayReminderEmail';
import { HostPrepSameDayEmail } from '../src/emails/HostPrepSameDayEmail';
import { PreStay24hEmail } from '../src/emails/PreStay24hEmail';
import { ReviewRequestEmail } from '../src/emails/ReviewRequestEmail';
import { ReceiptEmail } from '../src/emails/ReceiptEmail';
import {
  sampleBookingConfirmationProps,
  sampleBookingWelcomeProps,
  sampleHostNotificationProps,
  sampleHostGuestCancelledProps,
  sampleHostRefundAdjustmentProps,
  sampleHostPrepThreeDayProps,
  sampleDoorCodeProps,
  sampleMidStayCheckInProps,
  samplePaymentFailureProps,
  sampleCheckoutReminderProps,
  sampleGuestRefundIssuedProps,
  sampleCancellationConfirmationProps,
  samplePreStayReminderProps,
  samplePreStay24hProps,
  sampleHostPrepSameDayProps,
  sampleReceiptProps,
  sampleReviewRequestProps,
} from '../src/lib/email/sampleData';

const OUTPUT_DIR = path.join(process.cwd(), 'tmp', 'email-previews');

const templates = [
  {
    filename: 'booking-confirmation.html',
    description: 'Guest booking confirmation',
    render: () => renderEmail(<BookingConfirmationEmail {...sampleBookingConfirmationProps()} />),
  },
  {
    filename: 'host-notification.html',
    description: 'Host notification',
    render: () => renderEmail(<HostNotificationEmail {...sampleHostNotificationProps()} />),
  },
  {
    filename: 'host-prep-three-day.html',
    description: 'Host prep reminder (3 days)',
    render: () => renderEmail(<HostPrepThreeDayEmail {...sampleHostPrepThreeDayProps()} />),
  },
  {
    filename: 'host-prep-same-day.html',
    description: 'Host prep reminder (same day)',
    render: () => renderEmail(<HostPrepSameDayEmail {...sampleHostPrepSameDayProps()} />),
  },
  {
    filename: 'host-guest-cancelled.html',
    description: 'Host guest cancellation summary',
    render: () => renderEmail(<HostGuestCancelledEmail {...sampleHostGuestCancelledProps()} />),
  },
  {
    filename: 'host-refund-adjustment.html',
    description: 'Host refund adjustment notice',
    render: () => renderEmail(<HostRefundAdjustmentEmail {...sampleHostRefundAdjustmentProps()} />),
  },
  {
    filename: 'booking-welcome.html',
    description: 'Guest booking welcome + details',
    render: () => renderEmail(<BookingWelcomeEmail {...sampleBookingWelcomeProps()} />),
  },
  {
    filename: 'pre-stay-reminder.html',
    description: '48h reminder',
    render: () => renderEmail(<PreStayReminderEmail {...samplePreStayReminderProps()} />),
  },
  {
    filename: 'pre-stay-24h.html',
    description: '24h reminder',
    render: () => renderEmail(<PreStay24hEmail {...samplePreStay24hProps()} />),
  },
  {
    filename: 'door-code.html',
    description: 'Secure door code delivery',
    render: () => renderEmail(<DoorCodeEmail {...sampleDoorCodeProps()} />),
  },
  {
    filename: 'mid-stay-check-in.html',
    description: 'Day 2 concierge check-in',
    render: () => renderEmail(<MidStayCheckInEmail {...sampleMidStayCheckInProps()} />),
  },
  {
    filename: 'checkout-reminder.html',
    description: 'Checkout reminder',
    render: () => renderEmail(<CheckoutReminderEmail {...sampleCheckoutReminderProps()} />),
  },
  {
    filename: 'guest-refund-issued.html',
    description: 'Guest refund issued confirmation',
    render: () => renderEmail(<GuestRefundIssuedEmail {...sampleGuestRefundIssuedProps()} />),
  },
  {
    filename: 'cancellation-confirmation.html',
    description: 'Guest cancellation confirmation',
    render: () => renderEmail(<CancellationConfirmationEmail {...sampleCancellationConfirmationProps()} />),
  },
  {
    filename: 'payment-failure.html',
    description: 'Guest payment failure follow-up',
    render: () => renderEmail(<PaymentFailureEmail {...samplePaymentFailureProps()} />),
  },
  {
    filename: 'review-request.html',
    description: 'Post-stay review request',
    render: () => renderEmail(<ReviewRequestEmail {...sampleReviewRequestProps()} />),
  },
  {
    filename: 'receipt.html',
    description: 'Branded receipt',
    render: () => renderEmail(<ReceiptEmail {...sampleReceiptProps()} />),
  },
];

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const template of templates) {
    const filePath = path.join(OUTPUT_DIR, template.filename);
    try {
      const html = await template.render();
      await fs.writeFile(filePath, html, 'utf8');
      console.log(`✅ ${template.description} → ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to render ${template.description}`);
      throw error;
    }
  }

  console.log('\nOpen the files above in your browser to review layout + content.');
}

main().catch((err) => {
  console.error('Failed to render email previews');
  console.error(err);
  process.exit(1);
});
