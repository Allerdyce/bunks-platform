import * as React from 'react';
import { Button, Column, Heading, Hr, Row, Section, Text } from '@react-email/components';

// Small building blocks shared by the guest and host emails, so they look alike.

export function EmailTitle({ children }: { children: React.ReactNode }) {
  return <Heading className="m-0 text-2xl font-semibold leading-8 text-[#101828]">{children}</Heading>;
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text className="my-3 text-base leading-6 text-[#475467]">{children}</Text>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-1 mt-6 text-xs font-semibold uppercase tracking-wider text-[#667085]">{children}</Text>
  );
}

export type DetailRow = { label: string; value: React.ReactNode; strong?: boolean };

/** Label on the left, value on the right; one row each. */
export function DetailRows({ rows }: { rows: DetailRow[] }) {
  return (
    <Section className="rounded-xl border border-solid border-[#EAECF0] px-4 py-1">
      {rows.map((row, index) => (
        <Row key={`${row.label}-${index}`} className={index > 0 ? 'border-t border-solid border-[#F2F4F7]' : undefined}>
          <Column className="py-2 pr-3 align-top">
            <Text className={`m-0 text-sm ${row.strong ? 'font-semibold text-[#101828]' : 'text-[#475467]'}`}>{row.label}</Text>
          </Column>
          <Column align="right" className="py-2 align-top">
            <Text className={`m-0 text-sm ${row.strong ? 'font-semibold' : 'font-medium'} text-[#101828]`}>{row.value}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

export function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section className="my-6">
      <Button href={href} className="rounded-full bg-[#252723] px-6 py-3 text-sm font-semibold text-white">
        {children}
      </Button>
    </Section>
  );
}

export function Divider() {
  return <Hr className="my-6 border-[#EAECF0]" />;
}

export function SupportLine({ email, children }: { email: string; children?: React.ReactNode }) {
  return (
    <Text className="my-3 text-sm leading-6 text-[#475467]">
      {children ?? 'Questions? Reply to this email or write to'}{' '}
      <a href={`mailto:${email}`} className="text-[#101828] underline">
        {email}
      </a>
      .
    </Text>
  );
}
