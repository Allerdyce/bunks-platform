import { test } from "node:test";
import assert from "node:assert/strict";
import { templateDeliveryState } from "@/lib/email/deliverySettings";

test("the Wi-Fi welcome draft is paused unless explicitly unpaused", () => {
  delete process.env.EMAIL_UNPAUSED_TEMPLATES;
  assert.equal(templateDeliveryState("wifi-welcome"), "paused");
  process.env.EMAIL_UNPAUSED_TEMPLATES = "receipt, wifi-welcome";
  assert.equal(templateDeliveryState("wifi-welcome"), "sending");
  process.env.EMAIL_PAUSE_ALL = "true";
  assert.equal(templateDeliveryState("wifi-welcome"), "paused");
  delete process.env.EMAIL_PAUSE_ALL;
  delete process.env.EMAIL_UNPAUSED_TEMPLATES;
  assert.equal(templateDeliveryState("door-code-delivery"), "sending");
});
