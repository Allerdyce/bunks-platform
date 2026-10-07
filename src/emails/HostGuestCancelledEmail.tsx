import { EmailLayout } from './components/EmailLayout';
import { DetailRows, EmailTitle, Paragraph, PrimaryButton } from './components/parts';

export interface HostGuestCancelledEmailProps {
  propertyName: string;
  guestName: string;
  stayDates: string;
  bookingReference: string;
  refundAmount: string | null;
  cancelledBy?: string | null;
  adminUrl: string;
}

// To the Bunks team when a paid booking is cancelled from Admin.
export function HostGuestCancelledEmail(props: HostGuestCancelledEmailProps) {
  return (
    <EmailLayout
      previewText={`${props.guestName}'s stay at ${props.propertyName} (${props.stayDates}) was cancelled.`}
      footerText="Sent to the Bunks team when a booking is cancelled."
    >
      <EmailTitle>Booking cancelled: {props.propertyName}</EmailTitle>
      <Paragraph>
        {props.guestName}&apos;s stay was cancelled{props.cancelledBy ? ` in Admin by ${props.cancelledBy}` : ''}. The
        dates are open again on Bunks, and Airbnb picks this up from the Bunks calendar within a few hours.
      </Paragraph>
      <DetailRows
        rows={[
          { label: 'Dates', value: props.stayDates },
          { label: 'Guest', value: props.guestName },
          { label: 'Reference', value: props.bookingReference },
          { label: 'Refunded', value: props.refundAmount ?? 'Nothing', strong: true },
        ]}
      />
      <PrimaryButton href={props.adminUrl}>Open in Admin</PrimaryButton>
    </EmailLayout>
  );
}

export default HostGuestCancelledEmail;
