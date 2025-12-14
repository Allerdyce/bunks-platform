import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertBookingAccess,
  ensureConversation,
  getBookingWithPropertyOrThrow,
  getOrCreateUserForEmail,
  resolveMessagingRequester,
  serializeMessages,
  toHttpErrorResponse,
} from "@/lib/messaging/server";
import {
  sendGuestMessageNotification,
  sendHostMessageNotification,
} from "@/lib/email/sendMessagingNotifications";

export const runtime = "nodejs";

type ParamsOrPromise = { params: { bookingId?: string } } | { params: Promise<{ bookingId?: string }> };

type MessageRequestBody = {
  body?: unknown;
  guestEmail?: unknown;
  bookingReference?: unknown;
};

const resolveParams = async (context: ParamsOrPromise) =>
  typeof (context.params as Promise<{ bookingId?: string }>).then === "function"
    ? ((await context.params) as { bookingId?: string })
    : (context.params as { bookingId?: string });

export async function POST(request: NextRequest, context: ParamsOrPromise) {
  try {
    const params = await resolveParams(context);
    const bookingId = Number.parseInt(params.bookingId ?? "", 10);

    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    let payload: MessageRequestBody;
    try {
      payload = (await request.json()) as MessageRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const messageBody = typeof payload.body === "string" ? payload.body.trim() : "";
    if (!messageBody) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }

    const requester = resolveMessagingRequester(request, payload);
    if (!requester) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const booking = await getBookingWithPropertyOrThrow(bookingId);
    assertBookingAccess(booking, requester);

    const conversation = await ensureConversation(booking.id);

    const senderEmail = requester.kind === "guest" ? booking.guestEmail : requester.email;
    const senderName = requester.kind === "guest" ? booking.guestName : `${booking.property.name} Host`;
    const senderRole = requester.kind === "guest" ? UserRole.GUEST : UserRole.ADMIN;

    const senderUser = await getOrCreateUserForEmail(senderEmail, senderRole, senderName);

    const createdMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: senderUser.id,
        body: messageBody,
      },
      include: { sender: true },
    });

    const serialized = serializeMessages([createdMessage], {
      currentEmail: senderEmail,
      viewerKind: requester.kind,
    })[0];

    const notify = requester.kind === "guest"
      ? sendHostMessageNotification({ booking, messageBody, conversationId: conversation.id })
      : sendGuestMessageNotification({ booking, messageBody, conversationId: conversation.id });

    notify.catch((error) => {
      console.error("Failed to send messaging notification", error);
    });

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
