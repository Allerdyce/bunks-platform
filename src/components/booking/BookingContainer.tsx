"use client";

import { useRef, useState, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import type {
  BookingBreakdown,
  BookingClientState,
  DateRange,
  Property,
} from "@/types";
import { api } from "@/lib/api";
import { GuestDetailsForm } from "./GuestDetailsForm";
import { PaymentSection } from "./PaymentSection";
import { BookingSummary } from "./BookingSummary";

interface BookingContainerProps {
  property: Property;
  dates: DateRange;
  guestCount: number;
  onBack: () => void;
  onSuccess: (payload: { bookingReference: string; guestEmail: string }) => void;
}

const CLEANING_FEE = 85;
const SERVICE_FEE = 20;

const calculateNights = (range: DateRange) => {
  if (!range.start || !range.end) return 0;
  const diff = range.end.getTime() - range.start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export function BookingContainer({ property, dates, guestCount, onBack, onSuccess }: BookingContainerProps) {
  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [createdBookingReference, setCreatedBookingReference] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [quoteTotals, setQuoteTotals] = useState<{ totalCents: number; currency: string } | null>(null);
  const [pricingBreakdown, setPricingBreakdown] = useState<BookingBreakdown | null>(null);
  const [guestDetails, setGuestDetails] = useState<BookingClientState>({
    firstName: "",
    lastName: "",
    email: "",
    guests: guestCount,
  });
  const guestDetailsFormRef = useRef<HTMLFormElement>(null);

  const nights = useMemo(() => calculateNights(dates), [dates]);
  const fallbackTotals = useMemo(() => {
    const subtotal = nights * property.price;
    const cleaningFee = CLEANING_FEE;
    const serviceFee = SERVICE_FEE;
    const total = subtotal + cleaningFee + serviceFee;
    return { subtotal, cleaningFee, serviceFee, total };
  }, [nights, property.price]);

  const handleDetailsSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!dates.start || !dates.end) return;

    setIsLoadingIntent(true);
    setFormError(null);
    try {
      const normalizedEmail = guestDetails.email.trim();
      const payload = {
        propertySlug: property.slug,
        checkIn: dates.start.toISOString(),
        checkOut: dates.end.toISOString(),
        guestName: `${guestDetails.firstName} ${guestDetails.lastName}`.trim(),
        guestEmail: normalizedEmail,
        guests: guestDetails.guests,
      };

      const response = await api.createBooking(payload);
      setClientSecret(response.clientSecret);
      setCreatedBookingReference(response.bookingReference);
      setQuoteTotals({ totalCents: response.totalPriceCents, currency: response.currency.toUpperCase() });
      setPricingBreakdown(response.breakdown);
      setStep("payment");
    } catch (error) {
      console.error("Failed to initialize booking", error);
      const message = error instanceof Error && error.message
        ? error.message
        : "Could not initialize payment. Please try again.";
      setFormError(message);
      setPricingBreakdown(null);
      setQuoteTotals(null);
      setClientSecret(null);
      setCreatedBookingReference(null);
    } finally {
      setIsLoadingIntent(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (!createdBookingReference) {
      setFormError("We could not locate your booking reference. Please contact support.");
      return;
    }

    onSuccess({ bookingReference: createdBookingReference, guestEmail: guestDetails.email.trim() });
  };

  const handleRequestContinue = () => {
    guestDetailsFormRef.current?.requestSubmit();
  };

  const continueDisabled = isLoadingIntent;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to property
          </button>
          <h2 className="font-serif text-3xl text-gray-900 mb-2">
            {step === "details" ? "Guest Details" : "Confirm and Pay"}
          </h2>
          <p className="text-gray-500 mb-6">
            {step === "details" ? "Who is coming?" : "Complete your secure transaction."}
          </p>

          {step === "details" ? (
            <div className="space-y-4">
              <GuestDetailsForm
                value={guestDetails}
                maxGuests={property.guests}
                onChange={setGuestDetails}
                onSubmit={handleDetailsSubmit}
                isSubmitting={isLoadingIntent}
                formRef={guestDetailsFormRef}
                hideSubmitButton
              />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </div>
          ) : (
            <PaymentSection
              clientSecret={clientSecret}
              amountCents={quoteTotals?.totalCents ?? Math.round(fallbackTotals.total * 100)}
              currency={quoteTotals?.currency ?? "USD"}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </div>

        <BookingSummary
          property={property}
          nights={nights}
          breakdown={pricingBreakdown}
          fallbackPricing={{
            nightlyRate: property.price,
            cleaningFee: CLEANING_FEE,
            serviceFee: SERVICE_FEE,
          }}
          currency={quoteTotals?.currency ?? "USD"}
          onContinue={step === "details" ? handleRequestContinue : undefined}
          isContinueLoading={isLoadingIntent}
          isContinueDisabled={continueDisabled}
        />
      </div>
    </div>
  );
}
