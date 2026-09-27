import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { PROPERTY_GUIDE_FILES, type GuideKind } from "@/data/guides";
import { readSessionFromRequest } from "@/lib/adminAuth";
import { verifyGuideLink } from "@/lib/guideLinks";
import { prisma } from "@/lib/prisma";
import { rateLimitResponse } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex" };

const expired = () =>
  new NextResponse(
    "This guide link has expired or isn't valid. Open your trip at bunks.com/my-trips to get a fresh one.",
    { status: 403, headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" } },
  );

/** A property's guide PDF: for admins, or a paid booking holding a valid signed link (lib/guideLinks). */
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
      select: { status: true, property: { select: { slug: true } } },
    });
    if (!booking || booking.status !== "PAID" || booking.property.slug !== slug) {
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
