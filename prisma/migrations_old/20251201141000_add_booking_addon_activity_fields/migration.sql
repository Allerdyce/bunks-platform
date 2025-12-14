-- Add activity scheduling fields to BookingAddon records
ALTER TABLE "BookingAddon"
  ADD COLUMN "activityDate" TIMESTAMP(3),
  ADD COLUMN "activityTimeSlot" TEXT;
