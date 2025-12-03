import { ServerClient } from 'postmark';

const apiKey = process.env.POSTMARK_API_KEY;
const transactionalStream = process.env.POSTMARK_MESSAGE_STREAM ?? 'outbound';
const broadcastStream = process.env.POSTMARK_BROADCAST_STREAM ?? 'broadcast';

if (!apiKey) {
  console.warn('POSTMARK_API_KEY is not set. Email sending will be disabled.');
}

export const postmarkClient = apiKey ? new ServerClient(apiKey) : null;

export const MessageStream = {
  transactional: transactionalStream,
  broadcast: broadcastStream,
} as const;
