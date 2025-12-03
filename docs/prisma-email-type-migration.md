# Prisma EmailType Migration Plan

## Why we need this
All of the new host/system email templates now log against the `EmailTypeValue` union in `src/lib/email/logEmail.ts`, but the Prisma `EmailType` enum (and therefore the `EmailLog.type` column) was still limited to the legacy set. Attempting to log the new templates currently fails at runtime because Prisma/Postgres reject unknown enum values. We just updated `prisma/schema.prisma` so the schema matches the new helpers; now we need a migration to bring every environment's database in line.

## Enum deltas
- **Added values**: `HOST_ADDON_SOLD`, `HOST_BOOKING_MODIFIED`, `HOST_CHARGEBACK`, `HOST_CHECKOUT_CONFIRMED`, `HOST_CLEANER_ASSIGNED`, `HOST_CLEANER_REPORT`, `HOST_GUEST_CANCELLED`, `HOST_LISTING_READY`, `HOST_NOISE_ALERT`, `HOST_NO_SHOW`, `HOST_REFUND_ADJUSTMENT`, `HOST_VERIFICATION_PROGRESS`.
- **Renamed**: `HOST_ONBOARDING` ➜ `HOST_ONBOARDING_WELCOME` (matches the new template + helper).
- **Existing coverage**: all guest/system enums already present (`BOOKING_*`, `PRE_STAY_*`, `SYSTEM_*`, etc.) so no further changes required.

## Migration outline (automated via local shadow DB)
1. **Start local Postgres** (install via Homebrew once, then keep running in the background):
   ```bash
   brew services start postgresql@16
   /opt/homebrew/opt/postgresql@16/bin/createdb bunks_dev
   /opt/homebrew/opt/postgresql@16/bin/createdb bunks_shadow
   ```
   The `bunks_shadow` database is referenced by `SHADOW_DATABASE_URL` and Prisma only uses it while generating migrations.
2. **Generate the SQL diff automatically** without touching the remote Neon database:
   ```bash
   cd /Users/work/Desktop/bunks
   PRISMA_SHADOW_DATABASE_URL="postgresql://work@localhost:5432/bunks_shadow" \
   npx prisma migrate diff \
     --from-url "$DATABASE_URL" \
     --to-schema-datamodel prisma/schema.prisma \
     --script \
     > prisma/migrations/20251130120000_extend-email-types/migration.sql
   ```
   - `--from-url` points at the current production schema (Neon).
   - `--to-schema-datamodel` points at the latest Prisma datamodel.
   - The local shadow DB keeps Prisma happy even though Neon disallows schema resets.
3. **Inspect the generated SQL** (already committed) which safely recreates the enum via `EmailType_new`/`EmailType_old` swap so it works on any Postgres version ≥9.6.
4. **Regenerate the Prisma client** so TypeScript picks up the new enum members:
   ```bash
   npx prisma generate
   ```
5. **Deploy to other environments** once validated locally:
   ```bash
   npx prisma migrate deploy
   ```
6. **Smoke test email logging** by running any preview/send that hits `logEmailSend` and ensuring the row lands in `EmailLog` with the correct `type`.

> ℹ️ The diff-based workflow avoids hand-writing SQL while still keeping the Neon database untouched until `prisma migrate deploy` runs.
