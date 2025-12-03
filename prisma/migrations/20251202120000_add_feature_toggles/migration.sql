-- CreateTable
CREATE TABLE "FeatureToggle" (
    "id" SERIAL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger updatedAt is handled by Prisma's behaviour during updates.
