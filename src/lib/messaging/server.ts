import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import type { Booking, Message, Property, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/adminAuth";

export class MessagingError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const BOOKING_REFERENCE_PATTERN = /^[A-Z0-9]{5}$/;

export type MessagingRequester =
  | { kind: "admin"; email: string }
  | { kind: "guest"; email: string; bookingReference: string };

export type MessagingBooking = Booking & { property: Property };
type MessageWithSender = Message & { sender: User };

type RequestPayload = {
  guestEmail?: unknown;
  bookingReference?: unknown;
};

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() ?? null;

const normalizeBookingReference = (value?: string | null) => {
  if (!value) return null;
  const upper = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return BOOKING_REFERENCE_PATTERN.test(upper) ? upper : null;
};

export const resolveMessagingRequester = (request: NextRequest, payload?: RequestPayload): MessagingRequester | null => {
  const adminSession = withAdminAuth(request);
  if (adminSession) {
    return { kind: "admin", email: normalizeEmail(adminSession.email) ?? adminSession.email };
  }

  const searchParams = request.nextUrl.searchParams;
  const payloadEmail = typeof payload?.guestEmail === "string" ? payload?.guestEmail : undefined;
  const payloadReference = typeof payload?.bookingReference === "string" ? payload?.bookingReference : undefined;

  const candidateEmail = normalizeEmail(payloadEmail ?? searchParams.get("guestEmail"));
  const candidateReference = normalizeBookingReference(payloadReference ?? searchParams.get("bookingReference"));

  if (!candidateEmail || !candidateReference) {
    return null;
  }

  return { kind: "guest", email: candidateEmail, bookingReference: candidateReference };
};

export const getBookingWithPropertyOrThrow = async (bookingId: number): Promise<MessagingBooking> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new MessagingError("Booking not found", 404);
  }

  return booking;
};

export const assertBookingAccess = (booking: MessagingBooking, requester: MessagingRequester) => {
  if (requester.kind === "guest") {
    const normalizedGuestEmail = normalizeEmail(booking.guestEmail);
    const normalizedReference = normalizeBookingReference(booking.publicReference ?? undefined);

    const emailMatches = normalizedGuestEmail === requester.email;
    const referenceMatches = normalizedReference === requester.bookingReference;

    if (!emailMatches || !referenceMatches) {
      throw new MessagingError("You are not authorized to view this booking", 403);
    }
  }
};

export const getConversationWithMessages = async (bookingId: number) =>
  prisma.conversation.findUnique({
    where: { bookingId },
    include: {
      messages: {
        include: { sender: true },
        orderBy: { sentAt: "asc" },
      },
    },
  });

export const ensureConversation = async (bookingId: number) =>
  prisma.conversation.upsert({
    where: { bookingId },
    update: {},
    create: { bookingId },
  });

export const getOrCreateUserForEmail = async (email: string, role: UserRole, name?: string | null) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new MessagingError("A valid email is required for messaging", 400);
  }

  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: name ? { name } : {},
    create: {
      email: normalizedEmail,
      name,
      role,
    },
  });
};

type SerializeMessagesOptions = {
  currentEmail?: string | null;
  viewerKind?: MessagingRequester["kind"];
};

export const serializeMessages = (messages: MessageWithSender[], options?: SerializeMessagesOptions) => {
  const normalizedCurrent = normalizeEmail(options?.currentEmail);
  const viewerKind = options?.viewerKind;

  return messages.map((message) => {
    const senderEmail = normalizeEmail(message.sender.email);
    const isMine = viewerKind === "admin"
      ? message.sender.role !== UserRole.GUEST
      : normalizedCurrent
        ? senderEmail === normalizedCurrent
        : false;

    return {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderRole: message.sender.role,
      sentAt: message.sentAt.toISOString(),
      readAt: message.readAt ? message.readAt.toISOString() : null,
      isMine,
    };
  });
};

export const toHttpErrorResponse = (error: unknown) => {
  if (error instanceof MessagingError) {
    return { status: error.status, body: { error: error.message } };
  }
  console.error("Messaging API error", error);
  return { status: 500, body: { error: "Internal server error" } };
};