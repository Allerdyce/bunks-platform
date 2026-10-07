import "server-only";

import crypto from "crypto";
import { PROPERTY_GUIDE_FILES, isPlaceholderGuideUrl, type GuideKind } from "@/data/guides";
import { tripAccessWindow } from "@/lib/tripAccessWindow";

// The house guide has the door codes in it, so its link works only while the door codes do
// (lib/tripAccessWindow); the route enforces the start. The brochure link lasts until two weeks
// after checkout. The route also re-checks that the booking is still paid, so a cancellation
// revokes both.
const BROCHURE_GRACE_MS = 14 * 24 * 60 * 60 * 1000;

function linkSecret() {
  const secret = process.env.GUIDE_LINK_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("GUIDE_LINK_SECRET (or ADMIN_SESSION_SECRET) must be set");
  }
  return secret ?? "bunks-dev-guides";
}

function signature(slug: string, kind: string, ref: string, exp: number) {
  return crypto
    .createHmac("sha256", linkSecret())
    .update(`guide:${slug}:${kind}:${ref}:${exp}`)
    .digest("hex")
    .slice(0, 32);
}

type GuideBooking = {
  publicReference: string | null;
  checkInDate: Date;
  checkOutDate: Date;
  property: { slug: string };
};

/** A signed path to the property's guide PDF for this booking, or null if it has none. */
export function signedGuidePath(booking: GuideBooking, kind: GuideKind = "guide") {
  const slug = booking.property.slug;
  if (!booking.publicReference || !PROPERTY_GUIDE_FILES[slug]?.[kind]) return null;
  const expiresAt =
    kind === "guide"
      ? tripAccessWindow(booking).closesAt.getTime()
      : booking.checkOutDate.getTime() + BROCHURE_GRACE_MS;
  const exp = Math.floor(expiresAt / 1000);
  const params = new URLSearchParams({
    ref: booking.publicReference,
    exp: String(exp),
    sig: signature(slug, kind, booking.publicReference, exp),
  });
  return `/api/guides/${slug}/${kind}?${params.toString()}`;
}

/** The guide for a booking: its signed PDF link, else a stored URL that isn't a placeholder. */
export function guideUrlForBooking(
  booking: GuideBooking,
  ...storedUrls: Array<string | null | undefined>
) {
  return signedGuidePath(booking) ?? storedUrls.find((url) => !isPlaceholderGuideUrl(url)) ?? null;
}

export function verifyGuideLink(slug: string, kind: string, ref: string, exp: string, sig: string) {
  const expSeconds = Number(exp);
  if (!Number.isInteger(expSeconds) || expSeconds * 1000 < Date.now()) return false;
  const expected = Buffer.from(signature(slug, kind, ref, expSeconds));
  const given = Buffer.from(sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
