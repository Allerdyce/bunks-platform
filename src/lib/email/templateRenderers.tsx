import * as React from 'react';
import { renderEmail } from '@/lib/email';
import { BookingConfirmationEmail } from '@/emails/BookingConfirmationEmail';
import { BookingWelcomeEmail } from '@/emails/BookingWelcomeEmail';
import { ReceiptEmail } from '@/emails/ReceiptEmail';
import { PreStayReminderEmail } from '@/emails/PreStayReminderEmail';
import { PreStay24hEmail } from '@/emails/PreStay24hEmail';
import { DoorCodeEmail } from '@/emails/DoorCodeEmail';
import { MidStayCheckInEmail } from '@/emails/MidStayCheckInEmail';
import { CheckoutReminderEmail } from '@/emails/CheckoutReminderEmail';
import { ReviewRequestEmail } from '@/emails/ReviewRequestEmail';
import { GuestRefundIssuedEmail } from '@/emails/GuestRefundIssuedEmail';
import { CancellationConfirmationEmail } from '@/emails/CancellationConfirmationEmail';
import { PaymentFailureEmail } from '@/emails/PaymentFailureEmail';
import { HostNotificationEmail } from '@/emails/HostNotificationEmail';
import { HostPrepThreeDayEmail } from '@/emails/HostPrepThreeDayEmail';
import { HostPrepSameDayEmail } from '@/emails/HostPrepSameDayEmail';
import { HostGuestCancelledEmail } from '@/emails/HostGuestCancelledEmail';
import { HostRefundAdjustmentEmail } from '@/emails/HostRefundAdjustmentEmail';

import {
	sampleBookingConfirmationProps,
	sampleBookingWelcomeProps,
	sampleReceiptProps,
	samplePreStayReminderProps,
	samplePreStay24hProps,
	sampleDoorCodeProps,
	sampleMidStayCheckInProps,
	sampleCheckoutReminderProps,
	sampleReviewRequestProps,
	sampleGuestRefundIssuedProps,
	sampleCancellationConfirmationProps,
	samplePaymentFailureProps,
	sampleHostNotificationProps,
	sampleHostPrepThreeDayProps,
	sampleHostPrepSameDayProps,
	sampleHostGuestCancelledProps,
	sampleHostRefundAdjustmentProps,
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
	'checkout-reminder': {
		render: () => renderEmail(<CheckoutReminderEmail {...sampleCheckoutReminderProps()} />),
		getSampleProps: sampleCheckoutReminderProps,
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
	'payment-failure': {
		render: () => renderEmail(<PaymentFailureEmail {...samplePaymentFailureProps()} />),
		getSampleProps: samplePaymentFailureProps,
	},
	'host-new-booking': {
		render: () => renderEmail(<HostNotificationEmail {...sampleHostNotificationProps()} />),
		getSampleProps: sampleHostNotificationProps,
	},
	'host-prep-3-day': {
		render: () => renderEmail(<HostPrepThreeDayEmail {...sampleHostPrepThreeDayProps()} />),
		getSampleProps: sampleHostPrepThreeDayProps,
	},
	'host-prep-same-day': {
		render: () => renderEmail(<HostPrepSameDayEmail {...sampleHostPrepSameDayProps()} />),
		getSampleProps: sampleHostPrepSameDayProps,
	},
	'host-guest-cancelled': {
		render: () => renderEmail(<HostGuestCancelledEmail {...sampleHostGuestCancelledProps()} />),
		getSampleProps: sampleHostGuestCancelledProps,
	},
	'host-refund-adjustment': {
		render: () => renderEmail(<HostRefundAdjustmentEmail {...sampleHostRefundAdjustmentProps()} />),
		getSampleProps: sampleHostRefundAdjustmentProps,
	},
};

export function getTemplateRenderer(slug: string): TemplateRendererEntry | undefined {
	return TEMPLATE_RENDERERS[slug];
}
