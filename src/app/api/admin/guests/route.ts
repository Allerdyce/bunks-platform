import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/adminAuth";
import { ensureGuestLeadTable } from "@/lib/guestLeads";
import type { GuestListResponse, GuestRow, GuestSource } from "@/types/guests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Wi-Fi captures saved before GuestLead existed only created a User with this name.
const LEGACY_WIFI_USER_NAME = "WiFi Guest";

type GuestAccumulator = {
  email: string;
  name: string | null;
  sources: Set<GuestSource>;
  properties: Set<string>;
  wifiCaptures: number;
  directBookings: number;
  firstSeen: Date;
  lastSeen: Date;
  firstWifiAt: Date | null;
  bookingDates: Date[];
};

const csvEscape = (value: string | number | boolean | null) => {
  let text = value === null ? "" : String(value);
  // Stop spreadsheet apps from running guest-supplied text as a formula.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

async function loadGuests(): Promise<GuestListResponse> {
  await ensureGuestLeadTable();

  const [leads, legacyWifiUsers, bookings, properties] = await Promise.all([
    prisma.guestLead.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({
      where: { role: "GUEST", name: LEGACY_WIFI_USER_NAME },
      select: { email: true, createdAt: true, updatedAt: true },
    }),
    prisma.booking.findMany({
      where: { status: "PAID" },
      select: {
        guestEmail: true,
        guestName: true,
        createdAt: true,
        property: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.property.findMany({ select: { slug: true, name: true } }),
  ]);

  const propertyNames = new Map(properties.map((property) => [property.slug, property.name]));
  const guests = new Map<string, GuestAccumulator>();

  const touch = (rawEmail: string, seenAt: Date, lastAt: Date = seenAt) => {
    const email = rawEmail.trim().toLowerCase();
    let guest = guests.get(email);
    if (!guest) {
      guest = {
        email,
        name: null,
        sources: new Set(),
        properties: new Set(),
        wifiCaptures: 0,
        directBookings: 0,
        firstSeen: seenAt,
        lastSeen: lastAt,
        firstWifiAt: null,
        bookingDates: [],
      };
      guests.set(email, guest);
    }
    if (seenAt < guest.firstSeen) guest.firstSeen = seenAt;
    if (lastAt > guest.lastSeen) guest.lastSeen = lastAt;
    return guest;
  };

  const markWifi = (guest: GuestAccumulator, capturedAt: Date, captures: number) => {
    guest.sources.add("wifi");
    guest.wifiCaptures += captures;
    if (!guest.firstWifiAt || capturedAt < guest.firstWifiAt) guest.firstWifiAt = capturedAt;
  };

  for (const lead of leads) {
    const guest = touch(lead.email, lead.createdAt, lead.updatedAt);
    markWifi(guest, lead.createdAt, lead.captureCount);
    if (lead.name) guest.name = lead.name;
    if (lead.propertySlug) guest.properties.add(propertyNames.get(lead.propertySlug) ?? lead.propertySlug);
  }

  for (const user of legacyWifiUsers) {
    if (guests.get(user.email.trim().toLowerCase())?.sources.has("wifi")) continue;
    markWifi(touch(user.email, user.createdAt, user.updatedAt), user.createdAt, 1);
  }

  for (const booking of bookings) {
    const guest = touch(booking.guestEmail, booking.createdAt);
    guest.sources.add("direct_booking");
    guest.directBookings += 1;
    guest.bookingDates.push(booking.createdAt);
    if (booking.guestName) guest.name = booking.guestName;
    guest.properties.add(booking.property.name);
  }

  const rows: GuestRow[] = Array.from(guests.values())
    .map((guest) => ({
      email: guest.email,
      name: guest.name,
      sources: Array.from(guest.sources),
      properties: Array.from(guest.properties),
      wifiCaptures: guest.wifiCaptures,
      directBookings: guest.directBookings,
      firstSeen: guest.firstSeen.toISOString(),
      lastSeen: guest.lastSeen.toISOString(),
      returnedDirect: Boolean(
        guest.firstWifiAt && guest.bookingDates.some((bookedAt) => bookedAt > guest.firstWifiAt!),
      ),
    }))
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));

  return {
    guests: rows,
    summary: {
      total: rows.length,
      wifi: rows.filter((row) => row.sources.includes("wifi")).length,
      directBookers: rows.filter((row) => row.directBookings > 0).length,
      returnedDirect: rows.filter((row) => row.returnedDirect).length,
    },
  };
}

export async function GET(request: NextRequest) {
  if (!withAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await loadGuests();

    if (request.nextUrl.searchParams.get("format") === "csv") {
      const header = ["email", "name", "sources", "properties", "wifi_captures", "direct_bookings", "first_seen", "last_seen", "returned_direct"];
      const lines = data.guests.map((guest) =>
        [
          guest.email,
          guest.name,
          guest.sources.join(" "),
          guest.properties.join("; "),
          guest.wifiCaptures,
          guest.directBookings,
          guest.firstSeen,
          guest.lastSeen,
          guest.returnedDirect,
        ]
          .map(csvEscape)
          .join(","),
      );
      const filename = `bunks-guests-${new Date().toISOString().slice(0, 10)}.csv`;
      return new NextResponse([header.join(","), ...lines].join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load guest list", error);
    return NextResponse.json({ error: "Failed to load guest list" }, { status: 500 });
  }
}
