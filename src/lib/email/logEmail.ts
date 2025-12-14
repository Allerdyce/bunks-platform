import { prisma } from '@/lib/prisma';

type EmailTypeValue =

  | 'BOOKING_CONFIRMATION'
  | 'BOOKING_MODIFICATION'
  | 'BOOKING_WELCOME'
  | 'CANCELLATION_CONFIRMATION'
  | 'CHECKOUT_REMINDER'
  | 'DAMAGE_REPORT'
  | 'DEPOSIT_RELEASE'
  | 'DOOR_CODE_DELIVERY'
  | 'GUEST_REFUND_ISSUED'

  | 'HOST_BOOKING_MODIFIED'
  | 'HOST_CHARGEBACK'
  | 'HOST_CHECKOUT_CONFIRMED'
  | 'HOST_CLEANER_ASSIGNED'
  | 'HOST_CLEANER_REPORT'
  | 'HOST_DOOR_CODE_REMINDER'
  | 'HOST_GUEST_CANCELLED'
  | 'HOST_LISTING_READY'
  | 'HOST_NOISE_ALERT'
  | 'HOST_NO_SHOW'
  | 'HOST_NOTIFICATION'
  | 'HOST_ONBOARDING_WELCOME'
  | 'HOST_PREP_SAME_DAY'
  | 'HOST_PREP_THREE_DAY'
  | 'HOST_REFUND_ADJUSTMENT'
  | 'HOST_VERIFICATION_PROGRESS'
  | 'ISSUE_REPORT_CONFIRMATION'
  | 'MID_STAY_CONCIERGE'
  | 'NOISE_WARNING'
  | 'NO_SHOW_NOTIFICATION'
  | 'PAYMENT_FAILURE'
  | 'POST_STAY_THANK_YOU'
  | 'PRE_STAY_REMINDER'
  | 'PRE_STAY_REMINDER_24H'
  | 'RECEIPT'
  | 'REVIEW_REQUEST'
  | 'SYSTEM'
  | 'SYSTEM_BOOKING_CREATION_FAILED'
  | 'SYSTEM_CALENDAR_SYNC_ERROR'
  | 'SYSTEM_CRON_SUMMARY'
  | 'SYSTEM_EMAIL_FAILED'
  | 'SYSTEM_MAJOR_ISSUE'
  | 'SYSTEM_PAYMENT_EXCEPTION'
  | 'SYSTEM_STRIPE_WEBHOOK_FAILED';

type EmailStatusValue = 'SENT' | 'FAILED';

export async function logEmailSend(options: {
  bookingId?: number;
  to: string;
  type: EmailTypeValue;
  status?: EmailStatusValue;
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
