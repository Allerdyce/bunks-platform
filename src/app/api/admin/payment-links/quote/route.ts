import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { parseStayDate } from "@/lib/bookingAvailability";
import { suggestedCharges } from "@/lib/paymentLinks";
import { SERVICE_FEE_RATE } from "@/lib/pricing/calculator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The standard price for a stay, to pre-fill a payment link, plus the service fee rate and the
 * home's taxes so the form can recompute them when the admin edits the fees. charges is null when
 * the rates can't price it.
 */
export async function GET(request: NextRequest) {
  if (!withAdminAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const property = await prisma.property.findUnique({
    where: { id: Number(params.get("propertyId")) || -1 },
    include: { taxes: true },
  });
  if (!property) return NextResponse.json({ error: "Home not found." }, { status: 404 });
  const checkIn = parseStayDate(params.get("checkIn"));
  const checkOut = parseStayDate(params.get("checkOut"));
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return NextResponse.json({ error: "Choose a check-in date and a later check-out date." }, { status: 400 });
  }
  const guests = Math.max(1, Number(params.get("guests")) || 1);

  return NextResponse.json({
    charges: await suggestedCharges(property.slug, checkIn, checkOut, guests),
    serviceFeeRate: SERVICE_FEE_RATE,
    taxes: property.taxes.map((tax) => ({ name: tax.name, rate: tax.rate, appliesTo: tax.appliesTo })),
    maxGuests: property.maxGuests,
  });
}
