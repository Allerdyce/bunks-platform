import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

export interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
  footerText?: string;
}

const containerClassName =
  'mx-auto my-0 w-full max-w-[520px] rounded-lg border border-[#EAECF0] bg-white px-6 py-8 text-[#101828]';

export function EmailLayout({ previewText, children, footerText }: EmailLayoutProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="mx-auto bg-[#F8F9FC] px-2 py-6 font-sans">
          <Container className={containerClassName}>
            <Section>{children}</Section>
            <Hr className="my-6 border-[#EAECF0]" />
            <Text className="text-center text-xs text-[#98A2B3]">
              {footerText ?? 'You received this email because you booked a stay with Bunks.'}
            </Text>
            <Text className="mt-2 text-center text-xs text-[#98A2B3]">
              Bunks · Crafted stays across the mountains
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
