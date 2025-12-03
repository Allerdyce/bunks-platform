import * as React from 'react';
import { Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

export interface OnboardingStepItem {
  title: string;
  detail: string;
  status: 'done' | 'in-progress' | 'pending';
}

export interface ResourceLinkItem {
  label: string;
  href: string;
  description?: string;
}

export interface HostOnboardingWelcomeEmailProps {
  hostName: string;
  propertyName?: string;
  accountManager: string;
  accountContact: string;
  welcomeMessage: string;
  checklist: OnboardingStepItem[];
  resources?: ResourceLinkItem[];
  nextCall?: string;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #EAECF0',
  borderRadius: 18,
  padding: '20px 22px',
  backgroundColor: '#FFFFFF',
};

export function HostOnboardingWelcomeEmail(props: HostOnboardingWelcomeEmailProps) {
  const { hostName, propertyName, accountManager, accountContact, welcomeMessage, checklist, resources, nextCall } = props;

  const preview = `Welcome to Bunks, ${hostName}`;

  return (
    <EmailLayout previewText={preview} footerText="You&apos;re receiving this because you started Bunks onboarding.">
      <Section>
        <Text className="text-xs uppercase tracking-[0.35em] text-[#7F56D9]">Welcome</Text>
        <Heading as="h1" className="mt-2 text-3xl font-semibold text-[#101828]">
          Welcome aboard, {hostName}
        </Heading>
        <Text className="mt-3 text-sm text-[#475467]">
          {welcomeMessage}
        </Text>
        <Text className="mt-3 text-sm text-[#475467]">
          I&apos;m {accountManager} ({accountContact}). I&apos;ll guide you through getting {propertyName ?? 'your property'} live.
        </Text>
      </Section>

      <Section className="mt-6" style={cardStyle}>
        <Heading as="h2" className="text-xl font-semibold text-[#101828]">Launch checklist</Heading>
        <div className="mt-3 space-y-2">
          {checklist.map((item) => (
            <div key={item.title} style={{ borderBottom: '1px solid #F2F4F7', paddingBottom: 12 }}>
              <Text className="text-base font-semibold text-[#101828]">{item.title}</Text>
              <Text className="text-sm text-[#475467]">{item.detail}</Text>
              <Text className="text-xs text-[#667085]" style={{ textTransform: 'capitalize' }}>
                {item.status}
              </Text>
            </div>
          ))}
        </div>
      </Section>

      {resources?.length ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Resources</Heading>
          <div className="mt-3 flex flex-col gap-2">
            {resources.map((resource) => (
              <a key={resource.href} href={resource.href} className="text-sm text-[#7F56D9]">
                {resource.label}
                {resource.description ? (
                  <span style={{ display: 'block', color: '#475467' }}>{resource.description}</span>
                ) : null}
              </a>
            ))}
          </div>
        </Section>
      ) : null}

      {nextCall ? (
        <Section className="mt-6" style={cardStyle}>
          <Heading as="h3" className="text-lg font-semibold text-[#101828]">Next call</Heading>
          <Text className="text-sm text-[#475467]">{nextCall}</Text>
        </Section>
      ) : null}

      <Hr className="my-6 border-[#EAECF0]" />
      <Text className="text-xs text-[#98A2B3]">Reply to this thread any time to reach your onboarding manager.</Text>
    </EmailLayout>
  );
}

export default HostOnboardingWelcomeEmail;
