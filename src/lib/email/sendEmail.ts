import { MessageStream, postmarkClient } from './postmark';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  messageStream?: (typeof MessageStream)[keyof typeof MessageStream];
}

const DEFAULT_FROM = process.env.POSTMARK_FROM_ADDRESS ?? process.env.ADMIN_EMAIL ?? 'stays@bunks.com';

function normalizeRecipients(value?: string | string[]) {
  if (!value) return undefined;
  return Array.isArray(value) ? value.join(',') : value;
}

export async function sendEmail(options: SendEmailOptions) {
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
    ...(replyTo ? { ReplyTo: replyTo } : {}),
    ...(cc ? { Cc: normalizeRecipients(cc) } : {}),
    ...(bcc ? { Bcc: normalizeRecipients(bcc) } : {}),
  });
}
