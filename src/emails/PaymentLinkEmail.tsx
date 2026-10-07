import { EmailLayout } from './components/EmailLayout';
import { DetailRows, Divider, EmailTitle, Paragraph, PrimaryButton, SupportLine, type DetailRow } from './components/parts';

export interface PaymentLinkEmailProps {
  guestFirstName: string;
  propertyName: string;
  stayDates: string;
  chargeLines: { label: string; amount: string }[];
  total: string;
  payUrl: string;
  holdUntil: string;
  supportEmail: string;
}

// A private payment link from Admin → Bookings: the admin's price for one guest.
export function PaymentLinkEmail(props: PaymentLinkEmailProps) {
  const rows: DetailRow[] = [
    { label: 'Dates', value: props.stayDates },
    ...props.chargeLines.map((line) => ({ label: line.label, value: line.amount })),
    { label: 'Total', value: props.total, strong: true },
  ];
  return (
    <EmailLayout
      previewText={`Your private booking for ${props.propertyName}: ${props.total}, held until ${props.holdUntil}.`}
      footerText="You received this email because Bunks prepared a booking for you."
    >
      <EmailTitle>Your stay at {props.propertyName}</EmailTitle>
      <Paragraph>
        Hi {props.guestFirstName}, here&apos;s the booking we prepared for you. We&apos;re holding these dates until{' '}
        {props.holdUntil}.
      </Paragraph>
      <DetailRows rows={rows} />
      <PrimaryButton href={props.payUrl}>Review and pay {props.total}</PrimaryButton>
      <Paragraph>
        If you don&apos;t pay by then, the link expires and the dates may go to someone else.
      </Paragraph>
      <Divider />
      <SupportLine email={props.supportEmail} />
    </EmailLayout>
  );
}

export default PaymentLinkEmail;
