import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/adminAuth";

export const runtime = "nodejs";

const optionalText = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

const SettingsSchema = z.object({
  // One calendar link per line (every Airbnb listing for the home, Vrbo, …).
  airbnbIcalUrl: z
    .string()
    .trim()
    .max(4000)
    .refine(
      (value) => value.split(/\s+/).filter(Boolean).every((line) => z.string().url().safeParse(line).success),
      "Each calendar link must be a full https:// link, one per line.",
    )
    .transform((value) => value.split(/\s+/).filter(Boolean).join("\n"))
    .optional(),
  maxGuests: z.number().int().min(1).max(50).optional(),
  timezone: z
    .string()
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "Unknown timezone")
    .optional(),
  checkInTime: optionalText,
  checkOutTime: optionalText,
  hostSupportEmail: optionalText,
  wifiSsid: optionalText,
  wifiPassword: optionalText,
  garageCode: optionalText,
  lockboxCode: optionalText,
  skiLockerDoorCode: optionalText,
  skiLockerNumber: optionalText,
  skiLockerCode: optionalText,
  taxes: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        // Percent, e.g. 12 for 12%.
        ratePercent: z.number().min(0).max(30),
        appliesTo: z.array(z.enum(["nightly", "cleaning", "service"])).min(1),
      }),
    )
    .max(5)
    .optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!withAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const propertyId = Number((await params).id);
  if (!Number.isInteger(propertyId)) {
    return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
  }

  const parsed = SettingsSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 });
  }

  const { taxes, airbnbIcalUrl, ...fields } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.property.update({
      where: { id: propertyId },
      data: {
        ...fields,
        ...(airbnbIcalUrl !== undefined ? { airbnbIcalUrl } : {}),
      },
    });
    if (taxes) {
      await tx.propertyTax.deleteMany({ where: { propertyId } });
      if (taxes.length) {
        await tx.propertyTax.createMany({
          data: taxes.map((tax) => ({
            propertyId,
            name: tax.name,
            rate: tax.ratePercent / 100,
            appliesTo: tax.appliesTo,
          })),
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
