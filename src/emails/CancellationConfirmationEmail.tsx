import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { DetailRows, Divider, EmailTitle, Paragraph, PrimaryButton, SupportLine } from './components/parts';

export interface CancellationConfirmationEmailProps {
  guestFirstName: string;
  propertyName: string;
  bookingReference: string;
  stayDates: string;
  // Formatted refund, or null when no refund was due.
  refundAmount: string | null;
  cancellationPolicy: string;
  rebookUrl: string;
  supportEmail: string;
}

// Sent when a paid booking is cancelled from Admin → Bookings.
export function CancellationConfirmationEmail(props: CancellationConfirmationEmailProps) {
  return (
    <EmailLayout previewText={`Your stay at ${props.propertyName} (${props.stayDates}) is cancelled.`}>
      <EmailTitle>Your booking is cancelled</EmailTitle>
      <Paragraph>
        Hi {props.guestFirstName}, your stay at {props.propertyName} has been cancelled.
      </Paragraph>
      <DetailRows
        rows={[
          { label: 'Dates', value: props.stayDates },
          { label: 'Booking reference', value: props.bookingReference },
          { label: 'Refund', value: props.refundAmount ?? 'None', strong: true },
        ]}
      />
      <Paragraph>
        {props.refundAmount
          ? `We've refunded ${props.refundAmount} to your original payment method. Refunds usually appear within 5–10 business days, depending on your bank.`
          : `No refund was due under the cancellation policy: ${props.cancellationPolicy}`}
      </Paragraph>
      <PrimaryButton href={props.rebookUrl}>Find new dates</PrimaryButton>
      <Divider />
      <SupportLine email={props.supportEmail} />
    </EmailLayout>
  );
}

export default CancellationConfirmationEmail;
