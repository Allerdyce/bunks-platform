import { renderEmail } from '@/lib/email';
import { BookingConfirmationEmail } from '@/emails/BookingConfirmationEmail';
import { PaymentLinkEmail } from '@/emails/PaymentLinkEmail';
import { DoorCodeEmail } from '@/emails/DoorCodeEmail';
import { CheckoutReminderEmail } from '@/emails/CheckoutReminderEmail';
import { GuestRefundIssuedEmail } from '@/emails/GuestRefundIssuedEmail';
import { CancellationConfirmationEmail } from '@/emails/CancellationConfirmationEmail';
import { HostNotificationEmail } from '@/emails/HostNotificationEmail';
import { HostGuestCancelledEmail } from '@/emails/HostGuestCancelledEmail';
import { HostRefundAdjustmentEmail } from '@/emails/HostRefundAdjustmentEmail';

import {
	sampleBookingConfirmationProps,
	samplePaymentLinkProps,
	sampleDoorCodeProps,
	sampleCheckoutReminderProps,
	sampleGuestRefundIssuedProps,
	sampleCancellationConfirmationProps,
	sampleHostNotificationProps,
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
	'payment-link': {
		render: () => renderEmail(<PaymentLinkEmail {...samplePaymentLinkProps()} />),
		getSampleProps: samplePaymentLinkProps,
	},
	'door-code-delivery': {
		render: () => renderEmail(<DoorCodeEmail {...sampleDoorCodeProps()} />),
		getSampleProps: sampleDoorCodeProps,
	},
	'checkout-reminder': {
		render: () => renderEmail(<CheckoutReminderEmail {...sampleCheckoutReminderProps()} />),
		getSampleProps: sampleCheckoutReminderProps,
	},
	'guest-refund-issued': {
		render: () => renderEmail(<GuestRefundIssuedEmail {...sampleGuestRefundIssuedProps()} />),
		getSampleProps: sampleGuestRefundIssuedProps,
	},
	'cancellation-confirmation': {
		render: () => renderEmail(<CancellationConfirmationEmail {...sampleCancellationConfirmationProps()} />),
		getSampleProps: sampleCancellationConfirmationProps,
	},
	'host-new-booking': {
		render: () => renderEmail(<HostNotificationEmail {...sampleHostNotificationProps()} />),
		getSampleProps: sampleHostNotificationProps,
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
