// Minimal stateful Stripe API mock for local QA (never used in production).
// Implements only what the app calls: paymentIntents.create/retrieve/cancel, refunds.create.
// Test-control endpoints (not Stripe API):
//   POST /__test/succeed/:pi   -> marks PI succeeded and delivers a signed payment_intent.succeeded webhook
//   POST /__test/fail/:pi      -> delivers payment_intent.payment_failed
//   POST /__test/refund/:pi    -> delivers charge.refunded (full refund)
//   GET  /__test/state         -> dumps PIs and refunds
//   POST /__test/config        -> {failCreate:n} makes the next n PI creates fail with 500
import http from "node:http";
import crypto from "node:crypto";
import Stripe from "stripe";

const PORT = Number(process.env.MOCK_STRIPE_PORT || 12111);
const WEBHOOK_URL = process.env.MOCK_WEBHOOK_URL || "http://localhost:3000/api/stripe";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_localqa";
const stripe = new Stripe("sk_test_mock");

const pis = new Map();
const refunds = [];
const config = { failCreate: 0 }; // number of upcoming PI creates to fail (the SDK retries once)

const id = (p) => `${p}_${crypto.randomBytes(8).toString("hex")}`;
const parseForm = (body) => {
  const out = {};
  for (const [k, v] of new URLSearchParams(body)) {
    const m = k.match(/^(\w+)\[(\w+)\]$/);
    if (m) (out[m[1]] ??= {})[m[2]] = v;
    else out[k] = v;
  }
  return out;
};

async function deliver(type, object) {
  const payload = JSON.stringify({ id: id("evt"), object: "event", type, data: { object }, created: Math.floor(Date.now() / 1000) });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  const res = await fetch(WEBHOOK_URL, { method: "POST", headers: { "stripe-signature": header, "content-type": "application/json" }, body: payload });
  return { status: res.status, body: await res.text() };
}

const send = (res, status, obj) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  try {
    if (req.method === "POST" && p === "/v1/payment_intents") {
      if (config.failCreate > 0) { config.failCreate -= 1; return send(res, 500, { error: { type: "api_error", message: "mock failure" } }); }
      const f = parseForm(body);
      const idem = req.headers["idempotency-key"];
      if (idem) for (const pi of pis.values()) if (pi._idem === idem) return send(res, 200, pi);
      const pi = { id: id("pi"), object: "payment_intent", amount: Number(f.amount), amount_received: 0, currency: f.currency, status: "requires_payment_method", metadata: f.metadata ?? {}, receipt_email: f.receipt_email, client_secret: "", payment_method: null, latest_charge: null, _idem: idem };
      pi.client_secret = `${pi.id}_secret_mock`;
      pis.set(pi.id, pi);
      return send(res, 200, pi);
    }
    let m;
    if ((m = p.match(/^\/v1\/payment_intents\/(pi_\w+)$/)) && req.method === "GET") {
      const pi = pis.get(m[1]);
      return pi ? send(res, 200, pi) : send(res, 404, { error: { type: "invalid_request_error", message: "No such payment_intent" } });
    }
    if ((m = p.match(/^\/v1\/payment_intents\/(pi_\w+)\/cancel$/))) {
      const pi = pis.get(m[1]);
      if (!pi) return send(res, 404, { error: { type: "invalid_request_error", message: "No such payment_intent" } });
      if (pi.status === "succeeded") return send(res, 400, { error: { type: "invalid_request_error", message: "cannot cancel succeeded" } });
      pi.status = "canceled";
      return send(res, 200, pi);
    }
    if (req.method === "POST" && p === "/v1/refunds") {
      const f = parseForm(body);
      const pi = pis.get(f.payment_intent);
      if (!pi || pi.status !== "succeeded") return send(res, 400, { error: { type: "invalid_request_error", message: "PI not refundable" } });
      const already = refunds.filter((r) => r.payment_intent === pi.id).reduce((a, r) => a + r.amount, 0);
      const amount = f.amount ? Number(f.amount) : pi.amount_received - already;
      if (amount <= 0 || already + amount > pi.amount_received) return send(res, 400, { error: { type: "invalid_request_error", message: "Refund exceeds charge" } });
      const r = { id: id("re"), object: "refund", amount, payment_intent: pi.id, reason: f.reason ?? null, status: "succeeded" };
      refunds.push(r);
      return send(res, 200, r);
    }
    if ((m = p.match(/^\/__test\/succeed\/(pi_\w+)$/))) {
      const pi = pis.get(m[1]);
      if (!pi) return send(res, 404, { error: "no pi" });
      pi.status = "succeeded"; pi.amount_received = pi.amount;
      pi.payment_method = { card: { brand: "visa", last4: "4242" } };
      return send(res, 200, await deliver("payment_intent.succeeded", pi));
    }
    if ((m = p.match(/^\/__test\/mark-succeeded\/(pi_\w+)$/))) {
      // Payment succeeds at Stripe but the webhook hasn't been delivered yet.
      const pi = pis.get(m[1]);
      pi.status = "succeeded"; pi.amount_received = pi.amount;
      return send(res, 200, pi);
    }
    if ((m = p.match(/^\/__test\/fail\/(pi_\w+)$/))) {
      const pi = pis.get(m[1]);
      return send(res, 200, await deliver("payment_intent.payment_failed", { ...pi, last_payment_error: { message: "Your card was declined." } }));
    }
    if ((m = p.match(/^\/__test\/refund\/(pi_\w+)$/))) {
      const pi = pis.get(m[1]);
      const amount = refunds.filter((r) => r.payment_intent === pi.id).reduce((a, r) => a + r.amount, 0) || pi.amount_received;
      return send(res, 200, await deliver("charge.refunded", { id: id("ch"), object: "charge", payment_intent: pi.id, amount: pi.amount_received, amount_refunded: amount, refunded: amount >= pi.amount_received, currency: "usd" }));
    }
    if (p === "/__test/state") return send(res, 200, { pis: [...pis.values()], refunds });
    if (p === "/__test/config") { Object.assign(config, JSON.parse(body || "{}")); return send(res, 200, config); }
    return send(res, 404, { error: { type: "invalid_request_error", message: `mock: unhandled ${req.method} ${p}` } });
  } catch (e) {
    return send(res, 500, { error: { type: "api_error", message: String(e) } });
  }
}).listen(PORT, () => console.log(`stripe mock on :${PORT} → webhooks to ${WEBHOOK_URL}`));
