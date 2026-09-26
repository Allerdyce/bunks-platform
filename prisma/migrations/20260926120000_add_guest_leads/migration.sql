-- CreateTable
CREATE TABLE IF NOT EXISTS "GuestLead" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'wifi',
    "propertySlug" TEXT NOT NULL DEFAULT '',
    "captureCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "GuestLead_email_source_propertySlug_key" ON "GuestLead"("email", "source", "propertySlug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GuestLead_createdAt_idx" ON "GuestLead"("createdAt");
