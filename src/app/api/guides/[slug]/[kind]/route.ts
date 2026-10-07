import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { PROPERTY_GUIDE_FILES, type GuideKind } from "@/data/guides";
import { readSessionFromRequest } from "@/lib/adminAuth";
import { verifyGuideLink } from "@/lib/guideLinks";
import { prisma } from "@/lib/prisma";
import { rateLimitResponse } from "@/lib/rateLimit";
import { tripAccessWindow } from "@/lib/tripAccessWindow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex" };

const textResponse = (message: string) =>
  new NextResponse(message, { status: 403, headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" } });

const expired = () =>
  textResponse("This guide link has expired or isn't valid. Open your trip at www.bunks.com/my-trips to get a fresh one.");

const opensOn = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" });

/**
 * A property's guide PDF: for admins, or a paid booking holding a valid signed link (lib/guideLinks).
 * The house guide has the door codes in it, so guests can open it only from 24 hours before check-in.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ slug: string; kind: string }> }) {
  const limited = rateLimitResponse(req, "guide-download", 60, 10 * 60_000);
  if (limited) return limited;

  const { slug, kind } = await context.params;
  const file = PROPERTY_GUIDE_FILES[slug]?.[kind as GuideKind];
  if (!file) return expired();

  if (!readSessionFromRequest(req)) {
    const q = req.nextUrl.searchParams;
    const ref = q.get("ref") ?? "";
    if (!verifyGuideLink(slug, kind, ref, q.get("exp") ?? "", q.get("sig") ?? "")) {
      return expired();
    }
    const booking = await prisma.booking.findUnique({
      where: { publicReference: ref },
      select: { status: true, checkInDate: true, checkOutDate: true, property: { select: { slug: true } } },
    });
    if (!booking || booking.status !== "PAID" || booking.property.slug !== slug) {
      return expired();
    }
    const { opensAt, closesAt } = tripAccessWindow(booking);
    if (kind === "guide" && new Date() < opensAt) {
      return textResponse(
        `Your house guide opens on ${opensOn.format(opensAt)}, 24 hours before check-in. It has your door codes, so it isn't available earlier.`,
      );
    }
    if (kind === "guide" && new Date() > closesAt) {
      return expired();
    }
  }

  const pdf = await readFile(path.join(process.cwd(), "private", "guides", file));
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      ...NO_STORE,
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${file}"`,
    },
  });
}
