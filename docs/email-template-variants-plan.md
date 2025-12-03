# Email Template Variants Plan

Prepared Nov 30, 2025

## Goals
1. **Personalize tone/blocks per property program** (e.g., Flagship vs. Managed vs. Hosted).
2. **Support regulatory copy requirements** (different cancellation / tax / host-onboarding language by region).
3. **Reuse a single React Email component** with small, data-driven switches so ops can roll out variants without duplicating templates.

## Variant Axes
| Axis | Values | Affected Templates | Notes |
|------|--------|--------------------|-------|
| Brand voice | `"bunks"`, `"partners"` | Guest confirmations, receipts, host onboarding | Controls hero copy, signature, imagery.
| Property program | `"flagship"`, `"managed"`, `"host"` | Host prep, cleaner, damage, add-on | Toggles concierge block vs. DIY checklist.
| Region/compliance | `"us"`, `"eu"`, `"uk"` | Cancellation, refund, policy notices | Drives legal paragraph + CTA URLs.
| Audience sensitivity | `"standard"`, `"incident"` | Noise warning, damage, chargeback | Switches to softer or urgent tone.

## Implementation Steps
1. **Data modeling**
   - Extend `src/lib/email/catalog.ts` entries with an optional `variants` array describing supported combinations.
   - Update send helpers to accept a top-level `variant` field (narrow union per helper) and pass it through to templates.
   - Add `variant` to `EmailLog` + Prisma schema (nullable string) so ops can audit which flavor shipped.
2. **Template plumbing**
   - Introduce a shared `resolveEmailVariant` helper that merges default copy with overrides pulled from `src/data/emailVariants.ts`.
   - Refactor each template to read `variant` props for hero headline, supporting copy, CTA label, and optional sections (e.g., concierge footer).
   - Keep defaults identical to current shipped text to avoid regressions when variant omitted.
3. **Content source of truth**
   - Create `docs/email-variants-copy.md` capturing the tone/CTA/legal deltas per template + axis value.
   - Provide sample data for each variant inside `src/lib/email/sampleData.ts` (e.g., `hostPrepThreeDayFlagshipSample`).
4. **Preview and QA**
   - Update `/admin/emails` gallery to include a variant switcher (dropdown) that re-renders sample data accordingly.
   - Enhance `scripts/render-email-previews.tsx` to accept `--variant` CLI arg.
5. **Rollout plan**
   - Phase 1: Guest booking lifecycle (Receipt, Booking Welcome, Pre-Stay reminders) — focus on brand voice + regional copy.
   - Phase 2: Host prep/incident templates — enable property program + sensitivity variants.
   - Phase 3: System alerts — only brand voice adjustments if needed.
   - Add feature flag so we can enable per-property once ops finalizes copy.

## Open Questions
- Do we need per-property imagery swaps or just copy? If imagery required, upload variant-specific assets under `public/email-assets/<variant>/`.
- Should the `variant` come from bookings (e.g., `booking.property.program`)? Need confirmation from data model team.
- For legal copy, do we need translation support simultaneously? If yes, consider pairing variant work with i18n scaffolding to avoid duplicate effort.

## Immediate Next Tasks
1. Draft Prisma migration adding `variant` column to `EmailLog` (nullable string, <=32 chars).
2. Prototype variant prop in two templates (Receipt + Host Prep 3-Day) to validate approach.
3. Update catalog + docs to list supported variants and fallback behavior.
4. Ship admin preview toggle so stakeholders can approve copy before triggers flip live.
