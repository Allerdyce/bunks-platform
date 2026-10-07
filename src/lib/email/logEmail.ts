import type { EmailStatus, EmailType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function logEmailSend(options: {
  bookingId?: number;
  to: string;
  type: EmailType;
  status?: EmailStatus;
  error?: string;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        bookingId: options.bookingId,
        to: options.to,
        type: options.type,
        status: options.status ?? 'SENT',
        error: options.error,
      },
    });
  } catch (err) {
    console.error('Failed to log email send', err);
  }
}
