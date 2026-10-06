import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { DetailRows, Divider, EmailTitle, Paragraph, SupportLine } from './components/parts';

export interface GuestRefundIssuedEmailProps {
  guestFirstName: string;
  propertyName: string;
  bookingReference: string;
  stayDates: string;
  refundAmount: string;
  // A full refund cancels the booking.
  bookingCancelled: boolean;
  supportEmail: string;
}

// Sent when a refund is made in Stripe (outside Admin's Cancel, which sends its own email).
export function GuestRefundIssuedEmail(props: GuestRefundIssuedEmailProps) {
  return (
    <EmailLayout previewText={`We've refunded ${props.refundAmount} for your stay at ${props.propertyName}.`}>
      <EmailTitle>Your refund is on its way</EmailTitle>
      <Paragraph>
        Hi {props.guestFirstName}, we&apos;ve refunded {props.refundAmount} to your original payment method. Refunds
        usually appear within 5–10 business days, depending on your bank.
      </Paragraph>
      <DetailRows
        rows={[
          { label: 'Stay', value: `${props.propertyName}, ${props.stayDates}` },
          { label: 'Booking reference', value: props.bookingReference },
          { label: 'Refunded', value: props.refundAmount, strong: true },
          ...(props.bookingCancelled ? [{ label: 'Booking', value: 'Cancelled' }] : []),
        ]}
      />
      <Divider />
      <SupportLine email={props.supportEmail} />
    </EmailLayout>
  );
}

export default GuestRefundIssuedEmail;
