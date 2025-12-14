# Bunks — PriceLabs Integration Specification (for GPT-5.1 in VS Code)

**Goal:** Integrate the PriceLabs Connector API with Bunks so that Bunks can receive dynamic pricing and calendar updates from PriceLabs for each property (starting with the Steamboat property), and respond to PriceLabs sync hooks correctly.

> IMPORTANT: Do NOT hardcode any credentials. Use environment variables for all tokens and sensitive values.

---

## 1. Context and Current State

- Bunks is a direct-booking platform built with:
  - Next.js App Router
  - Prisma + Postgres (Neon)
  - Stripe (payments)
  - Postmark (emails)
  - Airbnb iCal for availability (Steamboat property).
- We now have PriceLabs **integration credentials** and want to use PriceLabs as the source of dynamic pricing and triggers.

The PriceLabs Connector API docs:

- KB: https://help.pricelabs.co/portal/en/kb/articles/building-an-integration-with-pricelabs
- OpenAPI: https://app.swaggerhub.com/apis/PriceLabs/price-labs_connector/1.0.0#/ 

Core concept:
- We register Bunks with PriceLabs using `/integration`.
- We give PriceLabs:
  - `sync_url`
  - `calendar_trigger_url`
  - `hook_url`
- PriceLabs then calls these URLs to sync pricing & trigger updates.
- We use the provided **integration name** and **token** for authentication both ways.

---

## 2. Environment Variables

Store all credentials in `.env` / `.env.local`:

```env
PRICELABS_INTEGRATION_NAME="bunks"
PRICELABS_INTEGRATION_TOKEN="REPLACE_WITH_TOKEN"
PRICELABS_BASE_URL="https://connect.pricelabs.co"  # verify from docs
PRICELABS_SYNC_URL="https://app.bunks.com/api/pricelabs/sync"
PRICELABS_CALENDAR_TRIGGER_URL="https://app.bunks.com/api/pricelabs/calendar-trigger"
PRICELABS_HOOK_URL="https://app.bunks.com/api/pricelabs/hook"
```

> GPT-5.1: **Never** inline the actual token. Always reference `process.env.PRICELABS_INTEGRATION_TOKEN`.

---

## 3. Prisma Model Updates

Extend the existing schema to support PriceLabs mapping and daily pricing.

```prisma
model Property {
  id                 Int      @id @default(autoincrement())
  name               String
  slug               String   @unique
  // existing fields...

  pricelabsListingId String?  // ID used by PriceLabs to identify this listing
}

model PropertyPricing {
  id          Int      @id @default(autoincrement())
  propertyId  Int
  property    Property @relation(fields: [propertyId], references: [id])

  date        DateTime
  nightlyRate Int      // in cents
  minNights   Int?
  isBlocked   Boolean  @default(false)
  source      String   @default("pricelabs")
  updatedAt   DateTime @default(now())
}
```

Run:

```bash
npx prisma migrate dev -n "add_pricelabs_fields"
```

---

## 4. PriceLabs Client (Backend Helper)

Create:

```ts
// src/lib/pricelabs/client.ts

const BASE_URL = process.env.PRICELABS_BASE_URL ?? "https://connect.pricelabs.co";

export async function postPricelabs<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const name = process.env.PRICELABS_INTEGRATION_NAME;
  const token = process.env.PRICELABS_INTEGRATION_TOKEN;

  if (!name || !token) {
    throw new Error("PriceLabs integration name/token not configured");
  }

  const url = new URL(path, BASE_URL).toString();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Integration-Name": name,
      "X-Integration-Token": token,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PriceLabs API error (${res.status}): ${text}`);
  }

  return (await res.json()) as TResponse;
}
```

You will use this for calling `/integration` and any other connector endpoints.

---

## 5. Register Integration URLs With `/integration`

We must call `/integration` once to tell PriceLabs where to send sync + hook events.

Assume production base URL is `https://app.bunks.com` (adjust as needed).

Desired URLs:

- `sync_url`: `https://app.bunks.com/api/pricelabs/sync`
- `calendar_trigger_url`: `https://app.bunks.com/api/pricelabs/calendar-trigger`
- `hook_url`: `https://app.bunks.com/api/pricelabs/hook`

Create a small registration helper:

```ts
// src/scripts/registerPricelabsIntegration.ts
import { postPricelabs } from "@/lib/pricelabs/client";

interface IntegrationRequest {
  sync_url: string;
  calendar_trigger_url: string;
  hook_url: string;
  regenerate_token?: boolean;
}

interface IntegrationResponse {
  integration_name: string;
  integration_token?: string;
  // ...other fields if present in Swagger
}

export async function registerPricelabsIntegration() {
  const body: IntegrationRequest = {
    sync_url: process.env.PRICELABS_SYNC_URL!,
    calendar_trigger_url: process.env.PRICELABS_CALENDAR_TRIGGER_URL!,
    hook_url: process.env.PRICELABS_HOOK_URL!,
    regenerate_token: false,
  };

  const response = await postPricelabs<IntegrationResponse>("/integration", body);

  console.log("PriceLabs integration registered:", response.integration_name);

  if (response.integration_token) {
    console.log("PriceLabs returned a new token. Update PRICELABS_INTEGRATION_TOKEN accordingly.");
  }
}
```

This can be executed via a Node script or an admin-only API route.

> Note: If you ever call `/integration` with `regenerate_token = true`, you must read `integration_token` from the response and update the env var.

---

## 6. Incoming Webhook Endpoints in Bunks

Create these API routes in the App Router:

### 6.1 `POST /api/pricelabs/sync`

Purpose: Receive pricing & calendar updates.

Steps:

1. Validate headers:
   - `X-Integration-Name` equals `process.env.PRICELABS_INTEGRATION_NAME`
   - `X-Integration-Token` equals `process.env.PRICELABS_INTEGRATION_TOKEN`
   - If mismatch → return 401.

2. Parse the JSON payload according to PriceLabs Swagger (`/sync` or equivalent). The payload typically contains:
   - Listing identifier (match with `Property.pricelabsListingId`)
   - Date-wise data: price, min nights, block flags

3. For each date/value:
   - Find the `Property` by `pricelabsListingId`.
   - Upsert a `PropertyPricing` row with:
     - `propertyId`
     - `date`
     - `nightlyRate` (convert to cents)
     - `minNights`
     - `isBlocked` if provided
     - `source = "pricelabs"`

4. Return `200 OK`.

### 6.2 `POST /api/pricelabs/calendar-trigger`

Purpose: PriceLabs calls this to trigger a calendar/pricing refresh for specific listing(s).

Steps (v1, simple):

- Validate headers as above.
- Log the payload.
- Optionally mark in DB that listing X had a trigger event (for debugging).
- Return `200 OK`.

You can expand later to do e.g. on-demand recalculations.

### 6.3 `POST /api/pricelabs/hook`

Purpose: Generic hook endpoint (health checks, integration events).

Steps:

- Validate headers.
- Log the event.
- Return `200 OK`.

For v1, treat as a no-op + logging endpoint.

---

## 7. Mapping the Steamboat Property to PriceLabs

For now, only the Steamboat property is in Bunks.

Steps:

1. Add `pricelabsListingId` to the Steamboat record (via seed or admin UI).

Example:

```ts
await prisma.property.update({
  where: { slug: "steamboat-downtown-townhome" },
  data: { pricelabsListingId: "STEAMBOAT_PL_ID" }, // replace with actual PL listing ID
});
```

2. Ensure PriceLabs uses this same ID in its connector payload (most commonly they either:
   - Use their own listing ID which they share with you, or
   - Allow storing an external ID that you define).

3. Confirm that when PriceLabs calls `/api/pricelabs/sync`, the payload contains a field you can use to match that `pricelabsListingId`.

---

## 8. Using PriceLabs Pricing in the Booking Flow

Update the booking logic so that dynamic rates drive totals.

### 8.1 Availability & Rate Check

When a guest selects check-in/check-out:

1. Query `PropertyPricing` for the relevant property and date range:
   - Ensure no `isBlocked = true` on any date in range.
   - Retrieve `nightlyRate` and `minNights` per date.

2. Validate:
   - Stay length respects `minNights` rules (basic v1 can just check the **check-in** date’s min nights; later you can be more granular).

3. Calculate:
   - Total = sum of `nightlyRate` over each night.
   - + cleaning fees, taxes, add-ons as before.

### 8.2 Stripe PaymentIntent Total

Use the computed total as the `amount` for Stripe PaymentIntent (in cents).  
This ensures PriceLabs pricing is used for direct bookings.

If there are any dates in the range **without** a `PropertyPricing` row:

- v1 strategy: fall back to base rate or disallow booking and show “Rates not available yet for these dates.”

---

## 9. Dev & Testing Notes

### 9.1 Local Testing

Since PriceLabs webhooks will call public URLs:

- For local dev, you can:
  - Use `ngrok` to expose your dev server and temporarily configure PriceLabs `sync_url` to the ngrok URL.
  - Or simulate the PriceLabs payload by manually `POST`ing JSON to `/api/pricelabs/sync`.

### 9.2 Logging

For all `/api/pricelabs/*` routes, add structured logging:

- Headers (excluding secrets)
- Payload summary (listing ID, date range count)
- Any DB write errors

This will make integration debugging much easier.

---

## 10. Implementation Steps for GPT-5.1

1. **Env Setup**
   - Add all `PRICELABS_*` variables to `.env.local`.

2. **Prisma**
   - Update `schema.prisma` with `pricelabsListingId` and `PropertyPricing`.
   - Run migrations.

3. **Client**
   - Implement `src/lib/pricelabs/client.ts` with `postPricelabs`.

4. **Integration Registration**
   - Implement `registerPricelabsIntegration` helper.
   - (Optional) Add an internal route or script entry to run it.

5. **API Routes**
   - Implement:
     - `POST /api/pricelabs/sync`
     - `POST /api/pricelabs/calendar-trigger`
     - `POST /api/pricelabs/hook`
   - Include header validation.

6. **Steamboat Mapping**
   - Add `pricelabsListingId` to Steamboat’s `Property` row.
   - Verify that PriceLabs payload mapping works in `/api/pricelabs/sync`.

7. **Booking Flow Changes**
   - Modify pricing calculation to pull from `PropertyPricing`.
   - Use dynamic rates in Stripe PaymentIntent creation.

8. **Testing**
   - Simulate a PriceLabs sync payload.
   - Confirm `PropertyPricing` rows exist for Steamboat.
   - Run a test booking and verify:
     - The correct total is used.
     - No blocked dates are bookable.

---

## 11. Expected Outcomes

After implementing this spec:

- Bunks will be able to receive and store PriceLabs-driven nightly pricing for the Steamboat property.
- Direct bookings will use up-to-date PriceLabs pricing instead of static base rates.
- The integration will be ready to extend to additional properties by assigning `pricelabsListingId` values and letting PriceLabs call the same endpoints.

