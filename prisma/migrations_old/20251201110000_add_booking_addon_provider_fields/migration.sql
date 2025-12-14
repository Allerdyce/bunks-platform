-- AlterTable
ALTER TABLE "BookingAddon" ADD COLUMN     "providerConfirmationCode" TEXT,
ADD COLUMN     "providerMetadata" JSONB,
ADD COLUMN     "providerStatus" TEXT NOT NULL DEFAULT 'pending';
