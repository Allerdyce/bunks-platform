import React from 'react';
import fs from 'node:fs/promises';
import path from 'node:path';

import { renderEmail } from '../src/lib/email/renderEmail';
import { BookingConfirmationEmail } from '../src/emails/BookingConfirmationEmail';
import { AddOnConfirmationEmail } from '../src/emails/AddOnConfirmationEmail';
import { BookingWelcomeEmail } from '../src/emails/BookingWelcomeEmail';
import { BookingModificationEmail } from '../src/emails/BookingModificationEmail';
import { HostAddOnSoldEmail } from '../src/emails/HostAddOnSoldEmail';
import { HostBookingModifiedEmail } from '../src/emails/HostBookingModifiedEmail';
import { HostChargebackEmail } from '../src/emails/HostChargebackEmail';
import { HostCheckoutConfirmedEmail } from '../src/emails/HostCheckoutConfirmedEmail';
import { HostCleanerAssignedEmail } from '../src/emails/HostCleanerAssignedEmail';
import { HostCleanerReportEmail } from '../src/emails/HostCleanerReportEmail';
import { HostDamageReportEmail } from '../src/emails/HostDamageReportEmail';
import { HostDoorCodeReminderEmail } from '../src/emails/HostDoorCodeReminderEmail';
import { HostGuestCancelledEmail } from '../src/emails/HostGuestCancelledEmail';
import { HostListingReadyEmail } from '../src/emails/HostListingReadyEmail';
import { HostNoiseAlertEmail } from '../src/emails/HostNoiseAlertEmail';
import { HostNotificationEmail } from '../src/emails/HostNotificationEmail';
import { HostNoShowEmail } from '../src/emails/HostNoShowEmail';
import { HostOnboardingWelcomeEmail } from '../src/emails/HostOnboardingWelcomeEmail';
import { HostRefundAdjustmentEmail } from '../src/emails/HostRefundAdjustmentEmail';
import { HostVerificationProgressEmail } from '../src/emails/HostVerificationProgressEmail';
import { HostPrepThreeDayEmail } from '../src/emails/HostPrepThreeDayEmail';
import { DoorCodeEmail } from '../src/emails/DoorCodeEmail';
import { MidStayCheckInEmail } from '../src/emails/MidStayCheckInEmail';
import { IssueReportConfirmationEmail } from '../src/emails/IssueReportConfirmationEmail';
import { CheckoutReminderEmail } from '../src/emails/CheckoutReminderEmail';
import { PostStayThankYouEmail } from '../src/emails/PostStayThankYouEmail';
import { GuestRefundIssuedEmail } from '../src/emails/GuestRefundIssuedEmail';
import { CancellationConfirmationEmail } from '../src/emails/CancellationConfirmationEmail';
import { NoiseWarningEmail } from '../src/emails/NoiseWarningEmail';
import { NoShowNotificationEmail } from '../src/emails/NoShowNotificationEmail';
import { PaymentFailureEmail } from '../src/emails/PaymentFailureEmail';
import { DepositReleaseEmail } from '../src/emails/DepositReleaseEmail';
import { SystemEmailFailedEmail } from '../src/emails/SystemEmailFailedEmail';
import { SystemStripeWebhookFailedEmail } from '../src/emails/SystemStripeWebhookFailedEmail';
import { SystemBookingCreationFailedEmail } from '../src/emails/SystemBookingCreationFailedEmail';
import { SystemMajorIssueEmail } from '../src/emails/SystemMajorIssueEmail';
import { SystemCalendarSyncErrorEmail } from '../src/emails/SystemCalendarSyncErrorEmail';
import { SystemCronSummaryEmail } from '../src/emails/SystemCronSummaryEmail';
import { SystemPaymentExceptionEmail } from '../src/emails/SystemPaymentExceptionEmail';
import { PreStayReminderEmail } from '../src/emails/PreStayReminderEmail';
import { HostPrepSameDayEmail } from '../src/emails/HostPrepSameDayEmail';
import { PreStay24hEmail } from '../src/emails/PreStay24hEmail';
import { ReviewRequestEmail } from '../src/emails/ReviewRequestEmail';
import { ReceiptEmail } from '../src/emails/ReceiptEmail';
import {
  sampleBookingConfirmationProps,
  sampleBookingWelcomeProps,
  sampleAddOnConfirmationProps,
  sampleHostNotificationProps,
  sampleHostDoorCodeReminderProps,
  sampleHostDamageReportProps,
  sampleHostAddOnSoldProps,
  sampleHostBookingModifiedProps,
  sampleHostCleanerReportProps,
  sampleHostNoiseAlertProps,
  sampleHostCheckoutConfirmedProps,
  sampleHostCleanerAssignedProps,
  sampleHostGuestCancelledProps,
  sampleHostNoShowProps,
  sampleHostRefundAdjustmentProps,
  sampleHostChargebackProps,
  sampleHostOnboardingWelcomeProps,
  sampleHostVerificationProgressProps,
  sampleHostListingReadyProps,
  sampleHostPrepThreeDayProps,
  sampleDoorCodeProps,
  sampleMidStayCheckInProps,
  sampleIssueReportConfirmationProps,
  sampleBookingModificationProps,
  sampleNoiseWarningProps,
  sampleNoShowNotificationProps,
  samplePaymentFailureProps,
  sampleDepositReleaseProps,
  sampleCheckoutReminderProps,
  samplePostStayThankYouProps,
  sampleGuestRefundIssuedProps,
  sampleCancellationConfirmationProps,
  sampleSystemEmailFailedProps,
  sampleSystemStripeWebhookFailedProps,
  sampleSystemBookingCreationFailedProps,
  sampleSystemCronSummaryProps,
  sampleSystemMajorIssueProps,
  sampleSystemCalendarSyncErrorProps,
  sampleSystemPaymentExceptionProps,
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
    filename: 'host-door-code-reminder.html',
    description: 'Host door code setup reminder',
    render: () => renderEmail(<HostDoorCodeReminderEmail {...sampleHostDoorCodeReminderProps()} />),
  },
  {
    filename: 'host-damage-report.html',
    description: 'Host damage / incident report',
    render: () => renderEmail(<HostDamageReportEmail {...sampleHostDamageReportProps()} />),
  },
  {
    filename: 'host-add-on-sold.html',
    description: 'Host alert · add-on sold',
    render: () => renderEmail(<HostAddOnSoldEmail {...sampleHostAddOnSoldProps()} />),
  },
  {
    filename: 'host-booking-modified.html',
    description: 'Host booking modification alert',
    render: () => renderEmail(<HostBookingModifiedEmail {...sampleHostBookingModifiedProps()} />),
  },
  {
    filename: 'host-cleaner-report.html',
    description: 'Host cleaner maintenance report',
    render: () => renderEmail(<HostCleanerReportEmail {...sampleHostCleanerReportProps()} />),
  },
  {
    filename: 'host-noise-alert.html',
    description: 'Host noise alert escalation',
    render: () => renderEmail(<HostNoiseAlertEmail {...sampleHostNoiseAlertProps()} />),
  },
  {
    filename: 'host-checkout-confirmed.html',
    description: 'Host checkout confirmed summary',
    render: () => renderEmail(<HostCheckoutConfirmedEmail {...sampleHostCheckoutConfirmedProps()} />),
  },
  {
    filename: 'host-cleaner-assigned.html',
    description: 'Host cleaner assignment digest',
    render: () => renderEmail(<HostCleanerAssignedEmail {...sampleHostCleanerAssignedProps()} />),
  },
  {
    filename: 'host-guest-cancelled.html',
    description: 'Host guest cancellation summary',
    render: () => renderEmail(<HostGuestCancelledEmail {...sampleHostGuestCancelledProps()} />),
  },
  {
    filename: 'host-no-show.html',
    description: 'Host no-show notice',
    render: () => renderEmail(<HostNoShowEmail {...sampleHostNoShowProps()} />),
  },
  {
    filename: 'host-refund-adjustment.html',
    description: 'Host refund adjustment notice',
    render: () => renderEmail(<HostRefundAdjustmentEmail {...sampleHostRefundAdjustmentProps()} />),
  },
  {
    filename: 'host-chargeback.html',
    description: 'Host chargeback / dispute alert',
    render: () => renderEmail(<HostChargebackEmail {...sampleHostChargebackProps()} />),
  },
  {
    filename: 'host-onboarding-welcome.html',
    description: 'Host onboarding welcome',
    render: () => renderEmail(<HostOnboardingWelcomeEmail {...sampleHostOnboardingWelcomeProps()} />),
  },
  {
    filename: 'host-verification-progress.html',
    description: 'Host verification progress update',
    render: () => renderEmail(<HostVerificationProgressEmail {...sampleHostVerificationProgressProps()} />),
  },
  {
    filename: 'host-listing-ready.html',
    description: 'Host listing ready preview',
    render: () => renderEmail(<HostListingReadyEmail {...sampleHostListingReadyProps()} />),
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
    filename: 'issue-report-confirmation.html',
    description: 'Guest issue report acknowledgment',
    render: () => renderEmail(<IssueReportConfirmationEmail {...sampleIssueReportConfirmationProps()} />),
  },
  {
    filename: 'noise-warning.html',
    description: 'Guest noise courtesy warning',
    render: () => renderEmail(<NoiseWarningEmail {...sampleNoiseWarningProps()} />),
  },
  {
    filename: 'checkout-reminder.html',
    description: 'Checkout reminder',
    render: () => renderEmail(<CheckoutReminderEmail {...sampleCheckoutReminderProps()} />),
  },
  {
    filename: 'post-stay-thank-you.html',
    description: 'Post-stay thank you + perks',
    render: () => renderEmail(<PostStayThankYouEmail {...samplePostStayThankYouProps()} />),
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
    filename: 'booking-modification.html',
    description: 'Guest booking modification confirmation',
    render: () => renderEmail(<BookingModificationEmail {...sampleBookingModificationProps()} />),
  },
  {
    filename: 'no-show-notification.html',
    description: 'Guest no-show summary',
    render: () => renderEmail(<NoShowNotificationEmail {...sampleNoShowNotificationProps()} />),
  },
  {
    filename: 'payment-failure.html',
    description: 'Guest payment failure follow-up',
    render: () => renderEmail(<PaymentFailureEmail {...samplePaymentFailureProps()} />),
  },
  {
    filename: 'deposit-release.html',
    description: 'Security deposit release confirmation',
    render: () => renderEmail(<DepositReleaseEmail {...sampleDepositReleaseProps()} />),
  },
  {
    filename: 'system-email-failed.html',
    description: 'System alert · email delivery failed',
    render: () => renderEmail(<SystemEmailFailedEmail {...sampleSystemEmailFailedProps()} />),
  },
  {
    filename: 'system-stripe-webhook-failed.html',
    description: 'System alert · Stripe webhook failed',
    render: () => renderEmail(<SystemStripeWebhookFailedEmail {...sampleSystemStripeWebhookFailedProps()} />),
  },
  {
    filename: 'system-booking-creation-failed.html',
    description: 'System alert · booking creation failed',
    render: () => renderEmail(<SystemBookingCreationFailedEmail {...sampleSystemBookingCreationFailedProps()} />),
  },
  {
    filename: 'system-cron-summary.html',
    description: 'System alert · cron summary',
    render: () => renderEmail(<SystemCronSummaryEmail {...sampleSystemCronSummaryProps()} />),
  },
  {
    filename: 'system-major-issue.html',
    description: 'System alert · major issue reported',
    render: () => renderEmail(<SystemMajorIssueEmail {...sampleSystemMajorIssueProps()} />),
  },
  {
    filename: 'system-calendar-sync-error.html',
    description: 'System alert · calendar sync error',
    render: () => renderEmail(<SystemCalendarSyncErrorEmail {...sampleSystemCalendarSyncErrorProps()} />),
  },
  {
    filename: 'system-payment-exception.html',
    description: 'System alert · payment exception detected',
    render: () => renderEmail(<SystemPaymentExceptionEmail {...sampleSystemPaymentExceptionProps()} />),
  },
  {
    filename: 'add-on-confirmation.html',
    description: 'Guest add-on confirmation',
    render: () => renderEmail(<AddOnConfirmationEmail {...sampleAddOnConfirmationProps()} />),
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
