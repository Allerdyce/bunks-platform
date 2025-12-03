import * as React from 'react';
import { HostOnboardingWelcomeEmail, type HostOnboardingWelcomeEmailProps } from '@/emails/HostOnboardingWelcomeEmail';
import { logEmailSend, renderEmail, sendEmail } from '@/lib/email';

const EMAIL_TYPE = 'HOST_ONBOARDING_WELCOME' as const;

export type SendHostOnboardingWelcomeOptions = HostOnboardingWelcomeEmailProps & {
  to?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subjectOverride?: string;
};

function ensurePayload(options: SendHostOnboardingWelcomeOptions) {
  if (!options.hostName) {
    throw new Error('sendHostOnboardingWelcome requires hostName.');
  }
  if (!options.accountManager) {
    throw new Error('sendHostOnboardingWelcome requires accountManager.');
  }
}

export async function sendHostOnboardingWelcome(options: SendHostOnboardingWelcomeOptions) {
  ensurePayload(options);

  const html = await renderEmail(
    <HostOnboardingWelcomeEmail
      hostName={options.hostName}
      propertyName={options.propertyName}
      accountManager={options.accountManager}
      accountContact={options.accountContact}
      welcomeMessage={options.welcomeMessage}
      checklist={options.checklist}
      resources={options.resources}
      nextCall={options.nextCall}
    />,
  );

  const to = options.to ?? options.accountContact ?? 'hosts@bunks.com';
  const subject = options.subjectOverride ?? `Welcome to Bunks, ${options.hostName}`;

  const logResult = async (status: 'SENT' | 'FAILED', error?: unknown) => {
    await logEmailSend({
      to: Array.isArray(to) ? to.join(',') : to,
      type: EMAIL_TYPE,
      status,
      error: error ? String((error as Error)?.message ?? error) : undefined,
    });
  };

  try {
    const response = await sendEmail({
      to,
      cc: options.cc,
      replyTo: options.replyTo ?? options.accountContact,
      subject,
      html,
    });
    await logResult('SENT');
    return response;
  } catch (error) {
    await logResult('FAILED', error);
    throw error;
  }
}
