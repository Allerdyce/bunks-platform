import { Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { Divider, EmailTitle, Paragraph, SectionTitle, SupportLine } from './components/parts';

export interface CheckoutReminderEmailProps {
  guestFirstName: string;
  propertyName: string;
  checkoutDay: 'today' | 'tomorrow';
  checkoutDate: string; // e.g. "Wed, Oct 7"
  checkoutTime: string; // e.g. "11:00 AM"
  checklist: string[];
  bookingReference: string;
  supportEmail: string;
}

// Sent the day before checkout (or on the morning of a one-night stay's checkout).
export function CheckoutReminderEmail(props: CheckoutReminderEmailProps) {
  return (
    <EmailLayout previewText={`Checkout ${props.checkoutDay} by ${props.checkoutTime} at ${props.propertyName}.`}>
      <EmailTitle>
        Checkout {props.checkoutDay} by {props.checkoutTime}
      </EmailTitle>
      <Paragraph>
        Hi {props.guestFirstName}, we hope you&apos;ve enjoyed {props.propertyName}. Checkout is {props.checkoutDate} by{' '}
        {props.checkoutTime}. Before you go:
      </Paragraph>

      <SectionTitle>Before you leave</SectionTitle>
      <Section className="rounded-xl border border-solid border-[#EAECF0] px-4 py-2">
        {props.checklist.map((item) => (
          <Text key={item} className="my-2 text-sm leading-6 text-[#344054]">
            ☐&nbsp;&nbsp;{item}
          </Text>
        ))}
      </Section>

      <Divider />
      <SupportLine email={props.supportEmail}>
        Need a little more time? Reply to this email (booking {props.bookingReference}) or write to
      </SupportLine>
      <Paragraph>Thanks for staying with us. We&apos;d love to have you back.</Paragraph>
    </EmailLayout>
  );
}

export default CheckoutReminderEmail;
