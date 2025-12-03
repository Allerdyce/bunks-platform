UPDATE "Booking"
SET "stripePaymentIntentId" = CONCAT('legacy_', "id")
WHERE "stripePaymentIntentId" = '';
