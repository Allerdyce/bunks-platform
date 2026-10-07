import { Link, Section, Text } from '@react-email/components';
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

export interface DoorCodeInstruction {
  title: string;
  detail: string;
}

export interface DoorCodeEmailProps {
  guestFirstName: string;
  propertyName: string;
  arrivalHeadline: string; // "See you tomorrow", "See you today" or "See you on Thu, Nov 5"
  checkIn: string; // e.g. "Wed, October 7 · from 3:00 PM"
  checkOut: string; // e.g. "Thu, October 8 · by 10:00 AM"
  address?: string | null;
  mapsUrl?: string | null;
  codeLabel?: string | null;
  doorCode?: string | null;
  entrySteps?: DoorCodeInstruction[];
  parkingInfo?: DoorCodeInstruction[];
  wifi?: { network: string; password: string } | null;
  tripUrl: string;
  bookingReference: string;
  supportEmail: string;
}

// Arrival details, sent the day before check-in (or at payment for a last-minute stay). Built
// only from what's saved for the home in Admin → Setup; nothing is invented.
export function DoorCodeEmail(props: DoorCodeEmailProps) {
  const arrival: DetailRow[] = [
    { label: 'Check-in', value: props.checkIn },
    { label: 'Check-out', value: props.checkOut },
    ...(props.address
      ? [
          {
            label: 'Address',
            value: props.mapsUrl ? (
              <Link href={props.mapsUrl} className="text-[#101828] underline">
                {props.address}
              </Link>
            ) : (
              props.address
            ),
          },
        ]
      : []),
  ];
  const access: DetailRow[] = (props.entrySteps ?? []).map((step) => ({ label: step.title, value: step.detail }));

  return (
    <EmailLayout previewText={`Your arrival details for ${props.propertyName}.`}>
      <EmailTitle>{props.arrivalHeadline}</EmailTitle>
      <Paragraph>
        Hi {props.guestFirstName}, here&apos;s everything for arriving at {props.propertyName}. Screenshot this email in
        case you lose signal on the way.
      </Paragraph>

      {props.doorCode ? (
        <Section className="my-4 rounded-xl bg-[#F8F7F4] px-5 py-4 text-center">
          <Text className="m-0 text-xs font-semibold uppercase tracking-wider text-[#667085]">
            {props.codeLabel ?? 'Entry code'}
          </Text>
          <Text className="m-0 mt-1 text-3xl font-semibold tracking-widest text-[#101828]">{props.doorCode}</Text>
          <Text className="m-0 mt-1 text-xs text-[#667085]">Please keep this code within your group.</Text>
        </Section>
      ) : null}

      <SectionTitle>Arrival</SectionTitle>
      <DetailRows rows={arrival} />

      {access.length ? (
        <>
          <SectionTitle>Other codes</SectionTitle>
          <DetailRows rows={access} />
        </>
      ) : null}

      {props.parkingInfo?.length ? (
        <>
          <SectionTitle>Parking</SectionTitle>
          {props.parkingInfo.map((item) => (
            <Paragraph key={item.title}>{item.detail}</Paragraph>
          ))}
        </>
      ) : null}

      {props.wifi ? (
        <>
          <SectionTitle>Wi-Fi</SectionTitle>
          <DetailRows
            rows={[
              { label: 'Network', value: props.wifi.network },
              { label: 'Password', value: props.wifi.password },
            ]}
          />
        </>
      ) : null}

      <PrimaryButton href={props.tripUrl}>View your trip</PrimaryButton>

      <Divider />
      <SupportLine email={props.supportEmail}>
        Need help on arrival? Reply to this email, mention booking {props.bookingReference}, or write to
      </SupportLine>
    </EmailLayout>
  );
}

export default DoorCodeEmail;
