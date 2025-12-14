import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/adminAuth";

export const runtime = "nodejs";

const normalizeSearch = (value?: string | null) => value?.trim() ?? "";

export async function GET(request: NextRequest) {
  const session = withAdminAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawSearch = normalizeSearch(request.nextUrl.searchParams.get("search"));
  const normalizedReference = rawSearch ? rawSearch.replace(/[^A-Z0-9]/gi, "").toUpperCase() : null;

  const whereClause = rawSearch
    ? {
      OR: [
        { guestEmail: { contains: rawSearch, mode: "insensitive" as const } },
        { guestName: { contains: rawSearch, mode: "insensitive" as const } },
        ...(normalizedReference && normalizedReference.length <= 12
          ? [{ publicReference: normalizedReference }]
          : []),
      ],
    }
    : undefined;

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    orderBy: { checkInDate: "desc" },
    take: 40,
    include: {
      property: true,
      conversation: {
        include: {
          messages: {
            orderBy: { sentAt: "desc" },
            take: 1,
            include: { sender: true },
          },
        },
      },
    },
  });

  const threads = bookings.map((booking) => {
    const latest = booking.conversation?.messages[0] ?? null;
    return {
      id: booking.id,
      referenceCode: booking.publicReference ?? null,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      checkInDate: booking.checkInDate.toISOString(),
      checkOutDate: booking.checkOutDate.toISOString(),
      property: {
        id: booking.property.id,
        name: booking.property.name,
        slug: booking.property.slug,
        hostSupportEmail: booking.property.hostSupportEmail ?? null,
      },
      lastMessage: latest
        ? {
          body: latest.body,
          sentAt: latest.sentAt.toISOString(),
          senderRole: latest.sender.role,
        }
        : null,
    };
  });

  return NextResponse.json({ threads });
}
