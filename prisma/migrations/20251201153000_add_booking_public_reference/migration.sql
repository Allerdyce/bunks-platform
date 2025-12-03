-- Add public booking reference code used in guest communications
ALTER TABLE "Booking"
  ADD COLUMN "publicReference" VARCHAR(32);

CREATE UNIQUE INDEX "Booking_publicReference_key" ON "Booking"("publicReference");
