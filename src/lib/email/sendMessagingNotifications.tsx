import * as React from "react";
import type { MessagingBooking } from "@/lib/messaging/server";
import { logEmailSend, renderEmail, sendEmail } from "@/lib/email";
import { NewMessageHostEmail } from "@/emails/NewMessageHostEmail";
import { NewMessageGuestEmail } from "@/emails/NewMessageGuestEmail";

const DEFAULT_HOST_EMAIL = process.env.MESSAGING_HOST_FALLBACK_EMAIL ?? process.env.ADMIN_EMAIL ?? "ops@bunks.com";
const HOST_PORTAL_URL = process.env.HOST_PORTAL_URL ?? "https://bunks.com/admin";
const GUEST_PORTAL_URL = process.env.GUEST_PORTAL_URL ?? "https://bunks.com/manage";

const buildGuestPortalUrl = (booking: MessagingBooking) => {
  if (booking.publicReference) {
    const params = new URLSearchParams({ reference: booking.publicReference });
    return `${GUEST_PORTAL_URL}?${params.toString()}`;
  }
  return `${GUEST_PORTAL_URL}?bookingId=${booking.id}`;
};

type NotificationArgs = {
  booking: MessagingBooking;
  messageBody: string;
  conversationId: number;
};

export async function sendHostMessageNotification({ booking, messageBody, conversationId }: NotificationArgs) {
  const to = booking.property.hostSupportEmail ?? DEFAULT_HOST_EMAIL;
  if (!to) {
    return;
  }

  const html = await renderEmail(
    <NewMessageHostEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      messageBody={messageBody}
      bookingReference={booking.publicReference ?? String(booking.id)}
      conversationUrl={`${HOST_PORTAL_URL}?bookingId=${booking.id}&tab=messages&conversationId=${conversationId}`}
    />,
  );

  await sendEmail({
    to,
    subject: `New guest message · ${booking.property.name}`,
    html,
  });

  await logEmailSend({ bookingId: booking.id, to, type: "HOST_NOTIFICATION" });
}

export async function sendGuestMessageNotification({ booking, messageBody, conversationId }: NotificationArgs) {
  const to = booking.guestEmail;
  if (!to) {
    return;
  }
  const supportEmail = booking.property.hostSupportEmail ?? DEFAULT_HOST_EMAIL;
  const html = await renderEmail(
    <NewMessageGuestEmail
      guestName={booking.guestName}
      propertyName={booking.property.name}
      hostLabel={`${booking.property.name} host team`}
      messageBody={messageBody}
      conversationUrl={`${buildGuestPortalUrl(booking)}&conversationId=${conversationId}`}
      supportEmail={supportEmail}
    />,
  );

  await sendEmail({
    to,
    subject: `${booking.property.name} sent you a new message`,
    html,
    replyTo: supportEmail,
  });

  await logEmailSend({ bookingId: booking.id, to, type: "BOOKING_MODIFICATION" });
}
