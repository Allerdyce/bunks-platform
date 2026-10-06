import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { DetailRows, EmailTitle, Paragraph, PrimaryButton } from './components/parts';

export interface HostRefundAdjustmentEmailProps {
  propertyName: string;
  guestName: string;
  stayDates: string;
  bookingReference: string;
  refundAmount: string;
  // A full refund cancels the booking and frees its dates.
  bookingCancelled: boolean;
  adminUrl: string;
}

// To the Bunks team when a refund is made in Stripe (Admin's Cancel sends its own notice).
export function HostRefundAdjustmentEmail(props: HostRefundAdjustmentEmailProps) {
  return (
    <EmailLayout
      previewText={`${props.refundAmount} refunded to ${props.guestName} for ${props.propertyName}.`}
      footerText="Sent to the Bunks team when a refund is made in Stripe."
    >
      <EmailTitle>Refund issued: {props.propertyName}</EmailTitle>
      <Paragraph>
        {props.refundAmount} was refunded to {props.guestName} in Stripe.{' '}
        {props.bookingCancelled
          ? 'That was a full refund, so the booking is cancelled and its dates are open again.'
          : 'It was a partial refund, so the booking stays confirmed.'}
      </Paragraph>
      <DetailRows
        rows={[
          { label: 'Dates', value: props.stayDates },
          { label: 'Guest', value: props.guestName },
          { label: 'Reference', value: props.bookingReference },
          { label: 'Booking', value: props.bookingCancelled ? 'Cancelled' : 'Still booked' },
          { label: 'Refunded', value: props.refundAmount, strong: true },
        ]}
      />
      <PrimaryButton href={props.adminUrl}>Open in Admin</PrimaryButton>
    </EmailLayout>
  );
}

export default HostRefundAdjustmentEmail;
