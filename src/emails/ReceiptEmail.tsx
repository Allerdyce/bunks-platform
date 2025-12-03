import * as React from 'react';
import { Heading, Hr, Row, Column, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface ReceiptLineItem {
  label: string;
  amount: string;
}

export interface ReceiptEmailProps {
  guestName: string;
  propertyName: string;
  stayDates: string;
  lineItems: ReceiptLineItem[];
  total: string;
  paymentMethod?: string;
  supportEmail?: string;
}

export function ReceiptEmail(props: ReceiptEmailProps) {
  const { guestName, propertyName, stayDates, lineItems, total, paymentMethod, supportEmail } = props;

  return (
    <EmailLayout previewText={`Receipt for ${propertyName} stay`}>
      <Heading className="text-2xl font-semibold">Receipt for your stay</Heading>
      <Text className="text-base text-[#475467]">
        Hi {guestName}, here&apos;s a breakdown of your booking at {propertyName} ({stayDates}).
      </Text>

      <Section className="mt-6 rounded-xl border border-[#EAECF0] p-4">
        {lineItems.map((item) => (
          <Row key={item.label} className="py-2 text-sm text-[#475467]">
            <Column>
              <Text>{item.label}</Text>
            </Column>
            <Column align="right">
              <Text className="font-semibold text-[#111827]">{item.amount}</Text>
            </Column>
          </Row>
        ))}
        <Hr className="my-4 border-[#EAECF0]" />
        <Row className="py-2 text-sm text-[#475467]">
          <Column>
            <Text className="font-semibold uppercase tracking-wide">Total</Text>
          </Column>
          <Column align="right">
            <Text className="text-lg font-semibold text-[#111827]">{total}</Text>
          </Column>
        </Row>
      </Section>

      {paymentMethod && (
        <Text className="mt-4 text-sm text-[#475467]">Charged to {paymentMethod}</Text>
      )}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-sm text-[#475467]">
        Questions? Reply to this email or contact {supportEmail ?? 'hello@bunks.com'}.
      </Text>
    </EmailLayout>
  );
}

export default ReceiptEmail;
