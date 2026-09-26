import "server-only";

import { prisma } from "@/lib/prisma";

export type GuestLeadSource = "wifi";

// Mirrors prisma/migrations/20260926120000_add_guest_leads/migration.sql
const GUEST_LEAD_TABLE_SQL = [
  `CREATE TABLE IF NOT EXISTS "GuestLead" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'wifi',
    "propertySlug" TEXT NOT NULL DEFAULT '',
    "captureCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuestLead_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GuestLead_email_source_propertySlug_key" ON "GuestLead"("email", "source", "propertySlug")`,
  `CREATE INDEX IF NOT EXISTS "GuestLead_createdAt_idx" ON "GuestLead"("createdAt")`,
];

let guestLeadTableEnsured = false;
let guestLeadTablePromise: Promise<void> | null = null;

// The production database is managed without `prisma migrate deploy`, so create the
// table on first use (same approach as Booking.publicReference in the bookings route).
export async function ensureGuestLeadTable() {
  if (guestLeadTableEnsured) {
    return;
  }

  if (guestLeadTablePromise) {
    return guestLeadTablePromise;
  }

  guestLeadTablePromise = (async () => {
    try {
      for (const statement of GUEST_LEAD_TABLE_SQL) {
        await prisma.$executeRawUnsafe(statement);
      }
      guestLeadTableEnsured = true;
    } finally {
      guestLeadTablePromise = null;
    }
  })();

  return guestLeadTablePromise;
}

type RecordGuestLeadInput = {
  email: string;
  name?: string | null;
  source: GuestLeadSource;
  propertySlug?: string | null;
};

export async function recordGuestLead({ email, name, source, propertySlug }: RecordGuestLeadInput) {
  await ensureGuestLeadTable();

  const trimmedName = name?.trim() || null;
  const slug = propertySlug?.trim() ?? "";

  return prisma.guestLead.upsert({
    where: { email_source_propertySlug: { email, source, propertySlug: slug } },
    update: {
      captureCount: { increment: 1 },
      ...(trimmedName ? { name: trimmedName } : {}),
    },
    create: {
      email,
      name: trimmedName,
      source,
      propertySlug: slug,
    },
  });
}
