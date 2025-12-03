import * as React from 'react';
import { Button, Column, Heading, Hr, Row, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface HostNotificationEmailProps {
  hostName?: string;
  propertyName: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalPayout: string;
  checklistItems?: string[];
  calendarUrl?: string;
  specialRequests?: string;
}

export function HostNotificationEmail(props: HostNotificationEmailProps) {
  const {
    hostName,
    propertyName,
    guestName,
    checkInDate,
    checkOutDate,
    nights,
    totalPayout,
    checklistItems,
    calendarUrl,
    specialRequests,
  } = props;

  return (
    <EmailLayout previewText={`New booking confirmed at ${propertyName}`}
      footerText="Keep delighting guests — the Bunks crew is here when you need us."
    >
      <Heading className="text-2xl font-semibold">
        New booking locked in {hostName ? `, ${hostName}` : ''}!
      </Heading>
      <Text className="mt-2 text-base text-[#475467]">
        {guestName} just confirmed {nights} night{nights === 1 ? '' : 's'} at {propertyName}. Here are the details so you can prep with ease.
      </Text>

      <Section className="mt-6 rounded-xl bg-[#F9F5FF] p-4">
        <Row>
          <Column>
            <Text className="text-sm font-semibold text-[#7F56D9]">Check-in</Text>
            <Text className="text-base text-[#1D2939]">{checkInDate}</Text>
          </Column>
          <Column>
            <Text className="text-sm font-semibold text-[#7F56D9]">Check-out</Text>
            <Text className="text-base text-[#1D2939]">{checkOutDate}</Text>
          </Column>
        </Row>
        <Row className="mt-4">
          <Column>
            <Text className="text-sm font-semibold text-[#7F56D9]">Payout</Text>
            <Text className="text-base text-[#1D2939]">{totalPayout}</Text>
          </Column>
          {calendarUrl && (
            <Column className="text-right">
              <Button
                className="inline-flex rounded-lg bg-[#7F56D9] px-3 py-2 text-sm font-semibold text-white"
                href={calendarUrl}
              >
                Add to calendar
              </Button>
            </Column>
          )}
        </Row>
      </Section>

      {specialRequests && (
        <Section className="mt-6">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Special requests
          </Heading>
          <Text className="text-sm text-[#475467]">{specialRequests}</Text>
        </Section>
      )}

      {checklistItems && checklistItems.length > 0 && (
        <Section className="mt-6">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Prep checklist
          </Heading>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#475467]">
            {checklistItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs uppercase tracking-wide text-[#98A2B3]">
        Powered by Bunks host services
      </Text>
    </EmailLayout>
  );
}

export default HostNotificationEmail;
