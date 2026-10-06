-- Private payment links: admin-priced bookings that hold their dates until the guest pays.
-- Additive and re-runnable. Apply to production BEFORE deploying the code that reads these
-- columns: Prisma selects every Booking column, so queries fail until they exist.

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "holdUntil" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentLinkToken" VARCHAR(64);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "createdByAdmin" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guestCount" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "nightlySubtotalCents" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cleaningFeeCents" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "serviceFeeCents" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "taxCents" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_paymentLinkToken_key" ON "Booking"("paymentLinkToken");
