import { test } from "node:test";
import assert from "node:assert/strict";
import { isTripAccessOpen, tripAccessWindow } from "@/lib/tripAccessWindow";
import { signedGuidePath, verifyGuideLink } from "@/lib/guideLinks";

// Stay dates are calendar dates stored as UTC midnight.
const stay = { checkInDate: new Date("2099-02-14T00:00:00Z"), checkOutDate: new Date("2099-02-18T00:00:00Z") };
const booking = { ...stay, publicReference: "K7Q2M", property: { slug: "steamboat-downtown-townhome" } };

test("door codes and the guide open 24h before check-in and close the day after checkout", () => {
  const { opensAt, closesAt } = tripAccessWindow(stay);
  assert.equal(opensAt.toISOString(), "2099-02-13T00:00:00.000Z");
  assert.equal(closesAt.toISOString(), "2099-02-19T00:00:00.000Z");
  assert.equal(isTripAccessOpen(stay, new Date("2099-02-12T23:59:59Z")), false);
  assert.equal(isTripAccessOpen(stay, new Date("2099-02-13T00:00:00Z")), true);
  assert.equal(isTripAccessOpen(stay, new Date("2099-02-18T22:00:00Z")), true);
  assert.equal(isTripAccessOpen(stay, new Date("2099-02-19T00:00:01Z")), false);
});

test("the guide link expires when the window closes; the brochure link lasts two weeks", () => {
  const exp = (path: string | null) => Number(new URLSearchParams(path?.split("?")[1]).get("exp"));
  assert.equal(exp(signedGuidePath(booking, "guide")) * 1000, Date.parse("2099-02-19T00:00:00Z"));
  assert.equal(exp(signedGuidePath(booking, "brochure")) * 1000, Date.parse("2099-03-04T00:00:00Z"));
});

test("a signed guide link verifies, and a changed expiry doesn't", () => {
  const params = new URLSearchParams(signedGuidePath(booking, "guide")!.split("?")[1]);
  const [ref, exp, sig] = [params.get("ref")!, params.get("exp")!, params.get("sig")!];
  assert.equal(verifyGuideLink("steamboat-downtown-townhome", "guide", ref, exp, sig), true);
  assert.equal(verifyGuideLink("steamboat-downtown-townhome", "guide", ref, String(Number(exp) + 86_400), sig), false);
});
