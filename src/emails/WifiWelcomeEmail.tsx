import * as React from 'react';
import { Img, Link, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { DetailRows, Divider, EmailTitle, Paragraph, PrimaryButton, SectionTitle, SupportLine } from './components/parts';

export interface WifiWelcomeEmailProps {
  guestName?: string | null;
  propertyName: string;
  imageUrl?: string | null;
  wifi: { network: string; password: string };
  /** The house guide PDF (homes whose guide has no lock codes), or the trip page. */
  guideUrl: string;
  guideIsTripPage: boolean;
  bookDirectUrl: string;
  supportEmail: string;
}

// Sent straight after a guest unlocks the Wi-Fi on the in-home page (QR code) and leaves their
// email, so the details are in their inbox for every other device.
export function WifiWelcomeEmail(props: WifiWelcomeEmailProps) {
  const firstName = props.guestName?.trim().split(/\s+/)[0];
  return (
    <EmailLayout
      previewText={`Your Wi-Fi details for ${props.propertyName}, plus the house guide.`}
      footerText={`You received this because you connected to the Wi-Fi at ${props.propertyName} and shared your email. Bunks LLC · 144 E Carrillo St · Santa Barbara, CA 93101`}
    >
      {props.imageUrl ? (
        <Section className="mb-6 overflow-hidden rounded-lg">
          <Img src={props.imageUrl} width="100%" alt={props.propertyName} style={{ width: '100%', maxWidth: '100%', borderRadius: 8 }} />
        </Section>
      ) : null}

      <EmailTitle>Welcome to {props.propertyName}</EmailTitle>
      <Paragraph>
        {firstName ? `Hi ${firstName}, you're` : "You're"} connected. Here are the Wi-Fi details to keep handy for your
        other devices.
      </Paragraph>

      <SectionTitle>Wi-Fi</SectionTitle>
      <DetailRows
        rows={[
          { label: 'Network', value: props.wifi.network, strong: true },
          { label: 'Password', value: props.wifi.password, strong: true },
        ]}
      />

      <SectionTitle>House guide</SectionTitle>
      <Paragraph>
        {props.guideIsTripPage
          ? 'Check-out steps, house notes and our local favorites are on your trip page. Sign in with your booking reference and email.'
          : 'Everything about the home, check-out steps and our local favorites, all in one place.'}
      </Paragraph>
      <PrimaryButton href={props.guideUrl}>{props.guideIsTripPage ? 'Open your trip page' : 'Open the house guide'}</PrimaryButton>

      <Divider />
      <Text className="my-3 text-sm leading-6 text-[#475467]">
        Enjoying your stay? Next time, book directly with us and save 10% compared with Airbnb.{' '}
        <Link href={props.bookDirectUrl} className="text-[#101828] underline">
          See dates and direct rates
        </Link>
      </Text>
      <SupportLine email={props.supportEmail} />
    </EmailLayout>
  );
}

export default WifiWelcomeEmail;
