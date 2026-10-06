import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { DetailRows, EmailTitle, Paragraph, PrimaryButton } from './components/parts';

export interface HostNotificationEmailProps {
  propertyName: string;
  guestName: string;
  guestEmail: string;
  guests?: number | null;
  stayDates: string;
  nights: number;
  totalPaid: string;
  bookingReference: string;
  source: string; // "Website checkout" or "Private payment link (ali@bunks.com)"
  adminUrl: string;
}

// To the Bunks team when a booking is paid.
export function HostNotificationEmail(props: HostNotificationEmailProps) {
  return (
    <EmailLayout
      previewText={`${props.guestName} booked ${props.propertyName}, ${props.stayDates}.`}
      footerText="Sent to the Bunks team when a booking is paid."
    >
      <EmailTitle>New booking: {props.propertyName}</EmailTitle>
      <Paragraph>
        {props.guestName} booked {props.nights} night{props.nights === 1 ? '' : 's'} and paid {props.totalPaid}.
      </Paragraph>
      <DetailRows
        rows={[
          { label: 'Dates', value: props.stayDates },
          { label: 'Nights', value: String(props.nights) },
          ...(props.guests ? [{ label: 'Guests', value: String(props.guests) }] : []),
          { label: 'Guest', value: `${props.guestName} · ${props.guestEmail}` },
          { label: 'Reference', value: props.bookingReference },
          { label: 'Booked via', value: props.source },
          { label: 'Paid (incl. fees & tax)', value: props.totalPaid, strong: true },
        ]}
      />
      <PrimaryButton href={props.adminUrl}>Open in Admin</PrimaryButton>
    </EmailLayout>
  );
}

export default HostNotificationEmail;
