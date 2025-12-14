import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { logEmailSend, renderEmail, resolveHostSupportEmail, sendEmail } from '@/lib/email';
import { ReviewRequestEmail } from '@/emails/ReviewRequestEmail';

const EMAIL_TYPE = 'REVIEW_REQUEST' as const;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bunks.com';

export async function sendReviewRequest(bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }
  return null;

  // FEATURE DISABLED: Review links not yet implemented
  // return null; // This line was moved

  /*
  const reviewUrl = `${APP_URL}/properties/${booking.property.slug}?review=1&booking=${booking.id}`;

  const html = await renderEmail(
    <ReviewRequestEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      reviewUrl={reviewUrl}
      stayHighlights={`Loved hosting you at ${booking.property.name}. If anything could be smoother, hit reply.`}
      incentiveCopy="Share your feedback to unlock VIP rates on your next stay."
      supportEmail={resolveHostSupportEmail(booking)}
    />
  );

  try {
    const response = await sendEmail({
      to: booking.guestEmail,
      subject: `Quick favor? Review ${booking.property.name}`,
      html,
    });

    await logEmailSend({
      bookingId: booking.id,
      to: booking.guestEmail,
      type: EMAIL_TYPE,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await logEmailSend({
      bookingId: booking.id,
      to: booking.guestEmail,
      type: EMAIL_TYPE,
      status: 'FAILED',
      error: message,
    });
    throw error;
  }
  */
}
