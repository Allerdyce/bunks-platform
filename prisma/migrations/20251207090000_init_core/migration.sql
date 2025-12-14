-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BlockSource" AS ENUM ('AIRBNB', 'DIRECT');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('ADDON_CONFIRMATION', 'ADDON_NOTIFICATION', 'BOOKING_CONFIRMATION', 'BOOKING_MODIFICATION', 'BOOKING_WELCOME', 'CANCELLATION_CONFIRMATION', 'CHECKOUT_REMINDER', 'DAMAGE_REPORT', 'DEPOSIT_RELEASE', 'DOOR_CODE_DELIVERY', 'GUEST_REFUND_ISSUED', 'HOST_ADDON_SOLD', 'HOST_BOOKING_MODIFIED', 'HOST_CHARGEBACK', 'HOST_CHECKOUT_CONFIRMED', 'HOST_CLEANER_ASSIGNED', 'HOST_CLEANER_REPORT', 'HOST_DOOR_CODE_REMINDER', 'HOST_GUEST_CANCELLED', 'HOST_LISTING_READY', 'HOST_NOISE_ALERT', 'HOST_NO_SHOW', 'HOST_NOTIFICATION', 'HOST_ONBOARDING_WELCOME', 'HOST_PREP_SAME_DAY', 'HOST_PREP_THREE_DAY', 'HOST_REFUND_ADJUSTMENT', 'HOST_VERIFICATION_PROGRESS', 'ISSUE_REPORT_CONFIRMATION', 'MID_STAY_CONCIERGE', 'NOISE_WARNING', 'NO_SHOW_NOTIFICATION', 'PAYMENT_FAILURE', 'POST_STAY_THANK_YOU', 'PRE_STAY_REMINDER', 'PRE_STAY_REMINDER_24H', 'RECEIPT', 'REVIEW_REQUEST', 'SYSTEM', 'SYSTEM_BOOKING_CREATION_FAILED', 'SYSTEM_CALENDAR_SYNC_ERROR', 'SYSTEM_CRON_SUMMARY', 'SYSTEM_EMAIL_FAILED', 'SYSTEM_MAJOR_ISSUE', 'SYSTEM_PAYMENT_EXCEPTION', 'SYSTEM_STRIPE_WEBHOOK_FAILED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "airbnbIcalUrl" TEXT NOT NULL,
    "baseNightlyRate" INTEGER NOT NULL,
    "cleaningFee" INTEGER NOT NULL DEFAULT 8500,
    "maxGuests" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "serviceFee" INTEGER NOT NULL DEFAULT 2000,
    "weekdayRate" INTEGER NOT NULL DEFAULT 30000,
    "weekendRate" INTEGER NOT NULL DEFAULT 35000,
    "checkInGuideUrl" TEXT,
    "guestBookUrl" TEXT,
    "hostSupportEmail" TEXT,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "wifiSsid" TEXT,
    "wifiPassword" TEXT,
    "garageCode" TEXT,
    "lockboxCode" TEXT,
    "skiLockerDoorCode" TEXT,
    "skiLockerNumber" TEXT,
    "skiLockerCode" TEXT,
    "quietHours" TEXT,
    "parkingNotes" TEXT,
    "houseRules" JSONB,
    "emergencyContacts" JSONB,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "totalPriceCents" INTEGER NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInInstructionsOverride" TEXT,
    "guestBookUrlOverride" TEXT,
    "preStayReminderSentAt" TIMESTAMP(3),
    "reviewRequestSentAt" TIMESTAMP(3),
    "publicReference" VARCHAR(32),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "source" "BlockSource" NOT NULL,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialRate" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "price" INTEGER NOT NULL,
    "note" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER,
    "to" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerProductId" TEXT,
    "basePriceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "durationMinutes" INTEGER,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddon" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "finalPriceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerConfirmationCode" TEXT,
    "providerMetadata" JSONB,
    "providerStatus" TEXT NOT NULL DEFAULT 'pending',
    "activityDate" TIMESTAMP(3),
    "activityTimeSlot" TEXT,

    CONSTRAINT "BookingAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsContactProfile" (
    "id" SERIAL NOT NULL,
    "supportEmail" TEXT NOT NULL DEFAULT 'ali@bunks.com',
    "supportSmsNumber" TEXT NOT NULL DEFAULT '+1 (970) 555-0119',
    "opsEmail" TEXT NOT NULL DEFAULT 'ops@bunks.com',
    "opsPhone" TEXT NOT NULL DEFAULT '+1 (970) 555-0124',
    "opsDeskPhone" TEXT DEFAULT '+1 (970) 555-0101',
    "opsDeskHours" TEXT DEFAULT '07:00–22:00 MT',
    "conciergeName" TEXT DEFAULT 'Priya',
    "conciergeContact" TEXT DEFAULT 'Slack #host-support',
    "conciergeNotes" TEXT DEFAULT 'Add-on escalations',
    "emergencyContact" TEXT DEFAULT '911',
    "emergencyDetails" TEXT DEFAULT 'Share property code 8821',
    "doorCodesDocUrl" TEXT,
    "arrivalNotesUrl" TEXT,
    "liveInstructionsUrl" TEXT,
    "recommendationsUrl" TEXT,
    "guestBookUrl" TEXT,
    "checkInWindow" TEXT DEFAULT 'Check-in after 16:00',
    "checkOutTime" TEXT DEFAULT 'Checkout by 10:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsContactProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureToggle" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureToggle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripePaymentIntentId_key" ON "Booking"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_publicReference_key" ON "Booking"("publicReference");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialRate_propertyId_date_key" ON "SpecialRate"("propertyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Addon_slug_key" ON "Addon"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAddon_bookingId_addonId_key" ON "BookingAddon"("bookingId", "addonId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureToggle_key_key" ON "FeatureToggle"("key");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialRate" ADD CONSTRAINT "SpecialRate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "Addon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

