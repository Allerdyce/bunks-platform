import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface ReviewRequestEmailProps {
  guestName: string;
  propertyName: string;
  stayHighlights?: string;
  reviewUrl: string;
  incentiveCopy?: string;
  supportEmail?: string;
}

export function ReviewRequestEmail(props: ReviewRequestEmailProps) {
  const { guestName, propertyName, stayHighlights, reviewUrl, incentiveCopy, supportEmail } = props;

  return (
    <EmailLayout previewText={`Quick favor after ${propertyName}?`}>
      <Heading className="text-2xl font-semibold">We hope you loved it, {guestName}</Heading>
      <Text className="mt-2 text-base text-[#475467]">
        Your stay at {propertyName} means the world to us. If you have 45 seconds, would you leave a quick review?
      </Text>

      {stayHighlights && (
        <Section className="mt-4 rounded-xl bg-[#F4F7FE] p-4">
          <Heading as="h3" className="text-lg font-semibold text-[#111827]">
            Trip highlights we loved
          </Heading>
          <Text className="text-sm text-[#475467]">{stayHighlights}</Text>
        </Section>
      )}

      <Section className="mt-6 text-center">
        <Button
          className="inline-flex rounded-full bg-[#111827] px-8 py-3 text-base font-semibold text-white"
          href={reviewUrl}
        >
          Leave a quick review
        </Button>
        {incentiveCopy && (
          <Text className="mt-2 text-xs uppercase tracking-wide text-[#7F56D9]">
            {incentiveCopy}
          </Text>
        )}
      </Section>

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-sm text-[#475467]">
        Need anything? Reply to this email or reach us at {supportEmail ?? 'hello@bunks.com'}.
      </Text>
    </EmailLayout>
  );
}

export default ReviewRequestEmail;
