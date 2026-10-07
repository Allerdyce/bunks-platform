import { MessageStream, postmarkClient } from './postmark';
import { SUPPORT_EMAIL } from '@/lib/contact';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  messageStream?: (typeof MessageStream)[keyof typeof MessageStream];
  // Marketing email can be paused independently of transactional (booking/guest/host) email.
  category?: 'transactional' | 'marketing';
}

const DEFAULT_FROM = process.env.POSTMARK_FROM_ADDRESS ?? process.env.ADMIN_EMAIL ?? 'stays@bunks.com';

function normalizeRecipients(value?: string | string[]) {
  if (!value) return undefined;
  return Array.isArray(value) ? value.join(',') : value;
}

// Marketing email is paused unless EMAIL_SENDING_PAUSED=false. Transactional email always sends.
const MARKETING_EMAIL_PAUSED = process.env.EMAIL_SENDING_PAUSED !== 'false';
// Emergency stop for ALL outbound email (transactional included): set EMAIL_PAUSE_ALL=true.
const ALL_EMAIL_PAUSED = process.env.EMAIL_PAUSE_ALL === 'true';

/** True when a marketing email would be held back, so callers can skip the work entirely. */
export const isMarketingEmailPaused = () => ALL_EMAIL_PAUSED || MARKETING_EMAIL_PAUSED;

export async function sendEmail(options: SendEmailOptions) {
  const category = options.category ?? 'transactional';

  if (ALL_EMAIL_PAUSED) {
    console.info(`[email] All sending paused; skipped "${options.subject}"`);
    throw new Error('Email sending is paused (EMAIL_PAUSE_ALL).');
  }

  if (category === 'marketing' && MARKETING_EMAIL_PAUSED) {
    console.info(`[email] Marketing sending paused; skipped "${options.subject}"`);
    throw new Error('Marketing email sending is paused (EMAIL_SENDING_PAUSED).');
  }

  // Local QA: write emails to disk instead of sending (ignored in production).
  const captureDir = process.env.NODE_ENV !== 'production' ? process.env.EMAIL_CAPTURE_DIR : undefined;
  if (captureDir) {
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir(captureDir, { recursive: true });
    const file = `${captureDir}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
    await writeFile(file, JSON.stringify({ ...options, replyTo: options.replyTo ?? SUPPORT_EMAIL, from: DEFAULT_FROM }, null, 2));
    return { MessageID: `captured:${file}`, To: normalizeRecipients(options.to), SubmittedAt: new Date().toISOString(), ErrorCode: 0, Message: 'captured' };
  }

  if (!postmarkClient) {
    throw new Error('Postmark client is not configured. Missing POSTMARK_API_KEY.');
  }

  const { to, subject, html, replyTo, cc, bcc, messageStream } = options;

  return postmarkClient.sendEmail({
    From: DEFAULT_FROM,
    To: normalizeRecipients(to)!,
    Subject: subject,
    HtmlBody: html,
    MessageStream: messageStream ?? MessageStream.transactional,
    // Guest replies go to the support inbox unless a sender overrides it.
    ReplyTo: replyTo ?? SUPPORT_EMAIL,
    ...(cc ? { Cc: normalizeRecipients(cc) } : {}),
    ...(bcc ? { Bcc: normalizeRecipients(bcc) } : {}),
  });
}
