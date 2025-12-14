-- Add missing optional detail fields to Property table
ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "checkInTime" TEXT,
  ADD COLUMN IF NOT EXISTS "checkOutTime" TEXT,
  ADD COLUMN IF NOT EXISTS "wifiSsid" TEXT,
  ADD COLUMN IF NOT EXISTS "wifiPassword" TEXT,
  ADD COLUMN IF NOT EXISTS "garageCode" TEXT,
  ADD COLUMN IF NOT EXISTS "lockboxCode" TEXT,
  ADD COLUMN IF NOT EXISTS "skiLockerDoorCode" TEXT,
  ADD COLUMN IF NOT EXISTS "skiLockerNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "skiLockerCode" TEXT,
  ADD COLUMN IF NOT EXISTS "quietHours" TEXT,
  ADD COLUMN IF NOT EXISTS "parkingNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "houseRules" JSONB,
  ADD COLUMN IF NOT EXISTS "emergencyContacts" JSONB;
