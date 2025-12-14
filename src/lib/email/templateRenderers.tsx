import * as React from 'react';
import { renderEmail } from '@/lib/email';
import { BookingConfirmationEmail } from '@/emails/BookingConfirmationEmail';
import { BookingWelcomeEmail } from '@/emails/BookingWelcomeEmail';
import { ReceiptEmail } from '@/emails/ReceiptEmail';
import { PreStayReminderEmail } from '@/emails/PreStayReminderEmail';
import { PreStay24hEmail } from '@/emails/PreStay24hEmail';
import { DoorCodeEmail } from '@/emails/DoorCodeEmail';

import { MidStayCheckInEmail } from '@/emails/MidStayCheckInEmail';
import { IssueReportConfirmationEmail } from '@/emails/IssueReportConfirmationEmail';
import { NoiseWarningEmail } from '@/emails/NoiseWarningEmail';
import { CheckoutReminderEmail } from '@/emails/CheckoutReminderEmail';
import { PostStayThankYouEmail } from '@/emails/PostStayThankYouEmail';
import { ReviewRequestEmail } from '@/emails/ReviewRequestEmail';
import { GuestRefundIssuedEmail } from '@/emails/GuestRefundIssuedEmail';
import { CancellationConfirmationEmail } from '@/emails/CancellationConfirmationEmail';
import { BookingModificationEmail } from '@/emails/BookingModificationEmail';
import { NoShowNotificationEmail } from '@/emails/NoShowNotificationEmail';
import { PaymentFailureEmail } from '@/emails/PaymentFailureEmail';
import { DepositReleaseEmail } from '@/emails/DepositReleaseEmail';
import { HostNotificationEmail } from '@/emails/HostNotificationEmail';

import { HostBookingModifiedEmail } from '@/emails/HostBookingModifiedEmail';
import { HostPrepThreeDayEmail } from '@/emails/HostPrepThreeDayEmail';
import { HostPrepSameDayEmail } from '@/emails/HostPrepSameDayEmail';
import { HostDoorCodeReminderEmail } from '@/emails/HostDoorCodeReminderEmail';
import { HostDamageReportEmail } from '@/emails/HostDamageReportEmail';
import { HostCleanerReportEmail } from '@/emails/HostCleanerReportEmail';
import { HostNoiseAlertEmail } from '@/emails/HostNoiseAlertEmail';
import { HostCheckoutConfirmedEmail } from '@/emails/HostCheckoutConfirmedEmail';
import { HostCleanerAssignedEmail } from '@/emails/HostCleanerAssignedEmail';
import { HostGuestCancelledEmail } from '@/emails/HostGuestCancelledEmail';
import { HostNoShowEmail } from '@/emails/HostNoShowEmail';
import { HostRefundAdjustmentEmail } from '@/emails/HostRefundAdjustmentEmail';
import { HostChargebackEmail } from '@/emails/HostChargebackEmail';
import { HostOnboardingWelcomeEmail } from '@/emails/HostOnboardingWelcomeEmail';
import { HostVerificationProgressEmail } from '@/emails/HostVerificationProgressEmail';
import { HostListingReadyEmail } from '@/emails/HostListingReadyEmail';
import { SystemEmailFailedEmail } from '@/emails/SystemEmailFailedEmail';
import { SystemStripeWebhookFailedEmail } from '@/emails/SystemStripeWebhookFailedEmail';
import { SystemBookingCreationFailedEmail } from '@/emails/SystemBookingCreationFailedEmail';
import { SystemCronSummaryEmail } from '@/emails/SystemCronSummaryEmail';
import { SystemMajorIssueEmail } from '@/emails/SystemMajorIssueEmail';
import { SystemCalendarSyncErrorEmail } from '@/emails/SystemCalendarSyncErrorEmail';
import { SystemPaymentExceptionEmail } from '@/emails/SystemPaymentExceptionEmail';
import {
	sampleBookingConfirmationProps,
	sampleBookingWelcomeProps,
	sampleReceiptProps,
	samplePreStayReminderProps,
	samplePreStay24hProps,
	sampleDoorCodeProps,

	sampleMidStayCheckInProps,
	sampleIssueReportConfirmationProps,
	sampleNoiseWarningProps,
	sampleCheckoutReminderProps,
	samplePostStayThankYouProps,
	sampleReviewRequestProps,
	sampleGuestRefundIssuedProps,
	sampleCancellationConfirmationProps,
	sampleBookingModificationProps,
	sampleNoShowNotificationProps,
	samplePaymentFailureProps,
	sampleDepositReleaseProps,
	sampleHostNotificationProps,

	sampleHostBookingModifiedProps,
	sampleHostPrepThreeDayProps,
	sampleHostPrepSameDayProps,
	sampleHostDoorCodeReminderProps,
	sampleHostDamageReportProps,
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
	sampleSystemEmailFailedProps,
	sampleSystemStripeWebhookFailedProps,
	sampleSystemBookingCreationFailedProps,
	sampleSystemCronSummaryProps,
	sampleSystemMajorIssueProps,
	sampleSystemCalendarSyncErrorProps,
	sampleSystemPaymentExceptionProps,
} from '@/lib/email/sampleData';

export interface TemplateRendererEntry {
	render: () => Promise<string>;
	getSampleProps: () => unknown;
}

export const TEMPLATE_RENDERERS: Record<string, TemplateRendererEntry> = {
	'booking-confirmation': {
		render: () => renderEmail(<BookingConfirmationEmail {...sampleBookingConfirmationProps()} />),
		getSampleProps: sampleBookingConfirmationProps,
	},
	'booking-details-welcome': {
		render: () => renderEmail(<BookingWelcomeEmail {...sampleBookingWelcomeProps()} />),
		getSampleProps: sampleBookingWelcomeProps,
	},
	receipt: {
		render: () => renderEmail(<ReceiptEmail {...sampleReceiptProps()} />),
		getSampleProps: sampleReceiptProps,
	},
	'pre-stay-48h': {
		render: () => renderEmail(<PreStayReminderEmail {...samplePreStayReminderProps()} />),
		getSampleProps: samplePreStayReminderProps,
	},
	'pre-stay-24h': {
		render: () => renderEmail(<PreStay24hEmail {...samplePreStay24hProps()} />),
		getSampleProps: samplePreStay24hProps,
	},
	'door-code-delivery': {
		render: () => renderEmail(<DoorCodeEmail {...sampleDoorCodeProps()} />),
		getSampleProps: sampleDoorCodeProps,
	},

	'mid-stay-check-in': {
		render: () => renderEmail(<MidStayCheckInEmail {...sampleMidStayCheckInProps()} />),
		getSampleProps: sampleMidStayCheckInProps,
	},
	'issue-report-confirmation': {
		render: () => renderEmail(<IssueReportConfirmationEmail {...sampleIssueReportConfirmationProps()} />),
		getSampleProps: sampleIssueReportConfirmationProps,
	},
	'noise-warning': {
		render: () => renderEmail(<NoiseWarningEmail {...sampleNoiseWarningProps()} />),
		getSampleProps: sampleNoiseWarningProps,
	},
	'checkout-reminder': {
		render: () => renderEmail(<CheckoutReminderEmail {...sampleCheckoutReminderProps()} />),
		getSampleProps: sampleCheckoutReminderProps,
	},
	'post-stay-thank-you': {
		render: () => renderEmail(<PostStayThankYouEmail {...samplePostStayThankYouProps()} />),
		getSampleProps: samplePostStayThankYouProps,
	},
	'review-request': {
		render: () => renderEmail(<ReviewRequestEmail {...sampleReviewRequestProps()} />),
		getSampleProps: sampleReviewRequestProps,
	},
	'guest-refund-issued': {
		render: () => renderEmail(<GuestRefundIssuedEmail {...sampleGuestRefundIssuedProps()} />),
		getSampleProps: sampleGuestRefundIssuedProps,
	},
	'cancellation-confirmation': {
		render: () => renderEmail(<CancellationConfirmationEmail {...sampleCancellationConfirmationProps()} />),
		getSampleProps: sampleCancellationConfirmationProps,
	},
	'booking-modification-confirmation': {
		render: () => renderEmail(<BookingModificationEmail {...sampleBookingModificationProps()} />),
		getSampleProps: sampleBookingModificationProps,
	},
	'no-show-notification': {
		render: () => renderEmail(<NoShowNotificationEmail {...sampleNoShowNotificationProps()} />),
		getSampleProps: sampleNoShowNotificationProps,
	},
	'payment-failure': {
		render: () => renderEmail(<PaymentFailureEmail {...samplePaymentFailureProps()} />),
		getSampleProps: samplePaymentFailureProps,
	},
	'deposit-release': {
		render: () => renderEmail(<DepositReleaseEmail {...sampleDepositReleaseProps()} />),
		getSampleProps: sampleDepositReleaseProps,
	},
	'host-new-booking': {
		render: () => renderEmail(<HostNotificationEmail {...sampleHostNotificationProps()} />),
		getSampleProps: sampleHostNotificationProps,
	},

	'host-booking-modified': {
		render: () => renderEmail(<HostBookingModifiedEmail {...sampleHostBookingModifiedProps()} />),
		getSampleProps: sampleHostBookingModifiedProps,
	},
	'host-prep-3-day': {
		render: () => renderEmail(<HostPrepThreeDayEmail {...sampleHostPrepThreeDayProps()} />),
		getSampleProps: sampleHostPrepThreeDayProps,
	},
	'host-prep-same-day': {
		render: () => renderEmail(<HostPrepSameDayEmail {...sampleHostPrepSameDayProps()} />),
		getSampleProps: sampleHostPrepSameDayProps,
	},
	'host-door-code-reminder': {
		render: () => renderEmail(<HostDoorCodeReminderEmail {...sampleHostDoorCodeReminderProps()} />),
		getSampleProps: sampleHostDoorCodeReminderProps,
	},
	'host-damage-report': {
		render: () => renderEmail(<HostDamageReportEmail {...sampleHostDamageReportProps()} />),
		getSampleProps: sampleHostDamageReportProps,
	},
	'host-cleaner-report': {
		render: () => renderEmail(<HostCleanerReportEmail {...sampleHostCleanerReportProps()} />),
		getSampleProps: sampleHostCleanerReportProps,
	},
	'host-noise-alert': {
		render: () => renderEmail(<HostNoiseAlertEmail {...sampleHostNoiseAlertProps()} />),
		getSampleProps: sampleHostNoiseAlertProps,
	},
	'host-checkout-confirmed': {
		render: () => renderEmail(<HostCheckoutConfirmedEmail {...sampleHostCheckoutConfirmedProps()} />),
		getSampleProps: sampleHostCheckoutConfirmedProps,
	},
	'host-cleaner-assigned': {
		render: () => renderEmail(<HostCleanerAssignedEmail {...sampleHostCleanerAssignedProps()} />),
		getSampleProps: sampleHostCleanerAssignedProps,
	},
	'host-guest-cancelled': {
		render: () => renderEmail(<HostGuestCancelledEmail {...sampleHostGuestCancelledProps()} />),
		getSampleProps: sampleHostGuestCancelledProps,
	},
	'host-no-show': {
		render: () => renderEmail(<HostNoShowEmail {...sampleHostNoShowProps()} />),
		getSampleProps: sampleHostNoShowProps,
	},
	'host-refund-adjustment': {
		render: () => renderEmail(<HostRefundAdjustmentEmail {...sampleHostRefundAdjustmentProps()} />),
		getSampleProps: sampleHostRefundAdjustmentProps,
	},
	'host-chargeback': {
		render: () => renderEmail(<HostChargebackEmail {...sampleHostChargebackProps()} />),
		getSampleProps: sampleHostChargebackProps,
	},
	'host-onboarding-welcome': {
		render: () => renderEmail(<HostOnboardingWelcomeEmail {...sampleHostOnboardingWelcomeProps()} />),
		getSampleProps: sampleHostOnboardingWelcomeProps,
	},
	'host-verification-progress': {
		render: () => renderEmail(<HostVerificationProgressEmail {...sampleHostVerificationProgressProps()} />),
		getSampleProps: sampleHostVerificationProgressProps,
	},
	'host-listing-ready': {
		render: () => renderEmail(<HostListingReadyEmail {...sampleHostListingReadyProps()} />),
		getSampleProps: sampleHostListingReadyProps,
	},
	'system-email-failed': {
		render: () => renderEmail(<SystemEmailFailedEmail {...sampleSystemEmailFailedProps()} />),
		getSampleProps: sampleSystemEmailFailedProps,
	},
	'system-stripe-webhook-failed': {
		render: () => renderEmail(<SystemStripeWebhookFailedEmail {...sampleSystemStripeWebhookFailedProps()} />),
		getSampleProps: sampleSystemStripeWebhookFailedProps,
	},
	'system-booking-creation-failed': {
		render: () => renderEmail(<SystemBookingCreationFailedEmail {...sampleSystemBookingCreationFailedProps()} />),
		getSampleProps: sampleSystemBookingCreationFailedProps,
	},
	'system-cron-summary': {
		render: () => renderEmail(<SystemCronSummaryEmail {...sampleSystemCronSummaryProps()} />),
		getSampleProps: sampleSystemCronSummaryProps,
	},
	'system-major-issue': {
		render: () => renderEmail(<SystemMajorIssueEmail {...sampleSystemMajorIssueProps()} />),
		getSampleProps: sampleSystemMajorIssueProps,
	},
	'system-calendar-sync-error': {
		render: () => renderEmail(<SystemCalendarSyncErrorEmail {...sampleSystemCalendarSyncErrorProps()} />),
		getSampleProps: sampleSystemCalendarSyncErrorProps,
	},
	'system-payment-exception': {
		render: () => renderEmail(<SystemPaymentExceptionEmail {...sampleSystemPaymentExceptionProps()} />),
		getSampleProps: sampleSystemPaymentExceptionProps,
	},
};

export function getTemplateRenderer(slug: string): TemplateRendererEntry | undefined {
	return TEMPLATE_RENDERERS[slug];
}
