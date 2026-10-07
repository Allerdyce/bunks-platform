import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import {
  DetailRows,
  Divider,
  EmailTitle,
  Paragraph,
  PrimaryButton,
  SectionTitle,
  SupportLine,
  type DetailRow,
} from './components/parts';

export interface BookingConfirmationEmailProps {
  guestFirstName: string;
  propertyName: string;
  bookingReference: string;
  stayDates: string;
  checkIn: string; // e.g. "Thu, November 5 · from 3:00 PM"
  checkOut: string; // e.g. "Sun, November 8 · by 10:00 AM"
  nights: number;
  guests?: number | null;
  // The itemised charge, when it adds up to what was paid; otherwise just the total.
  chargeLines: { label: string; amount: string }[];
  totalPaid: string;
  tripUrl: string;
  cancellationPolicy: string;
  supportEmail: string;
}

// The one email a guest gets when they book: confirmation, receipt and how to find their trip.
export function BookingConfirmationEmail(props: BookingConfirmationEmailProps) {
  const stay: DetailRow[] = [
    { label: 'Check-in', value: props.checkIn },
    { label: 'Check-out', value: props.checkOut },
    { label: 'Nights', value: String(props.nights) },
    ...(props.guests ? [{ label: 'Guests', value: String(props.guests) }] : []),
    { label: 'Booking reference', value: props.bookingReference },
  ];
  const receipt: DetailRow[] = [
    ...props.chargeLines.map((line) => ({ label: line.label, value: line.amount })),
    { label: 'Total paid', value: props.totalPaid, strong: true },
  ];

  return (
    <EmailLayout previewText={`You're booked at ${props.propertyName}, ${props.stayDates}.`}>
      <EmailTitle>You&apos;re booked at {props.propertyName}</EmailTitle>
      <Paragraph>
        Hi {props.guestFirstName}, thanks for booking direct with Bunks. Your stay is confirmed and paid.
      </Paragraph>

      <SectionTitle>Your stay</SectionTitle>
      <DetailRows rows={stay} />

      <PrimaryButton href={props.tripUrl}>View your trip</PrimaryButton>
      <Paragraph>
        Your trip page has the address, Wi-Fi and house details. We&apos;ll email your arrival details, door code
        and house guide the day before you arrive.
      </Paragraph>

      <SectionTitle>Receipt</SectionTitle>
      <DetailRows rows={receipt} />

      <Divider />
      <Text className="my-3 text-sm leading-6 text-[#475467]">
        <strong className="text-[#101828]">Cancellation policy.</strong> {props.cancellationPolicy}
      </Text>
      <SupportLine email={props.supportEmail} />
    </EmailLayout>
  );
}

export default BookingConfirmationEmail;
