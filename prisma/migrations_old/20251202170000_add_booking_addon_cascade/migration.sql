-- Drop existing foreign key to re-create with cascading deletes
ALTER TABLE "BookingAddon" DROP CONSTRAINT IF EXISTS "BookingAddon_bookingId_fkey";

ALTER TABLE "BookingAddon"
ADD CONSTRAINT "BookingAddon_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
