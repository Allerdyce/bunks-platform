import { NextRequest, NextResponse } from "next/server";
import {
  assertBookingAccess,
  getBookingWithPropertyOrThrow,
  getConversationWithMessages,
  resolveMessagingRequester,
  serializeMessages,
  toHttpErrorResponse,
} from "@/lib/messaging/server";

export const runtime = "nodejs";

type ParamsOrPromise = { params: { bookingId?: string } } | { params: Promise<{ bookingId?: string }> };

const resolveParams = async (context: ParamsOrPromise) =>
  typeof (context.params as Promise<{ bookingId?: string }>).then === "function"
    ? ((await context.params) as { bookingId?: string })
    : (context.params as { bookingId?: string });

export async function GET(request: NextRequest, context: ParamsOrPromise) {
  try {
    const params = await resolveParams(context);
    const bookingId = Number.parseInt(params.bookingId ?? "", 10);

    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    const requester = resolveMessagingRequester(request);
    if (!requester) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const booking = await getBookingWithPropertyOrThrow(bookingId);
    assertBookingAccess(booking, requester);

    const conversation = await getConversationWithMessages(booking.id);
    const messages = conversation
      ? serializeMessages(conversation.messages, { currentEmail: requester.email, viewerKind: requester.kind })
      : [];

    return NextResponse.json({
      conversationId: conversation?.id ?? null,
      messages,
    });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
