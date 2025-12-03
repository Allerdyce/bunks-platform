"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type {
  AddonScheduleValue,
  BookingBreakdown,
  BookingClientState,
  DateRange,
  Property,
  PropertyAddon,
} from "@/types";
import { api } from "@/lib/api";
import { GuestDetailsForm } from "./GuestDetailsForm";
import { PaymentSection } from "./PaymentSection";
import { BookingSummary } from "./BookingSummary";
import { AddonSelector } from "./AddonSelector";

interface BookingContainerProps {
  property: Property;
  dates: DateRange;
  guestCount: number;
  onBack: () => void;
  onSuccess: (payload: { bookingReference: string; guestEmail: string }) => void;
}

const CLEANING_FEE = 85;
const SERVICE_FEE = 20;
const DEFAULT_ACTIVITY_TIME = "16:00";

const calculateNights = (range: DateRange) => {
  if (!range.start || !range.end) return 0;
  const diff = range.end.getTime() - range.start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const formatDateInput = (date: Date) => date.toISOString().split("T")[0];
const dayBefore = (date: Date) => new Date(date.getTime() - 24 * 60 * 60 * 1000);

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
  const [availableAddons, setAvailableAddons] = useState<PropertyAddon[]>([]);
  const [addonsFeatureEnabled, setAddonsFeatureEnabled] = useState(true);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);
  const [addonSchedules, setAddonSchedules] = useState<Record<number, AddonScheduleValue>>({});
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);
  const [addonsError, setAddonsError] = useState<string | null>(null);
  const guestDetailsFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingAddons(true);
    setAddonsError(null);
    setSelectedAddonIds([]);
    setAddonSchedules({});
    api
      .fetchAddonsForProperty(property.slug)
      .then(({ addons, addonsEnabled }) => {
        if (cancelled) return;
        setAvailableAddons(addons);
        setAddonsFeatureEnabled(addonsEnabled);
        if (!addonsEnabled) {
          setSelectedAddonIds([]);
          setAddonSchedules({});
        }
      })
      .catch((error) => {
        console.error("Failed to load addons", error);
        if (!cancelled) {
          setAddonsError("Unable to load add-ons. You can still continue booking.");
          setAvailableAddons([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAddons(false);
      });

    return () => {
      cancelled = true;
    };
  }, [property.slug]);

  const selectedAddons = useMemo(
    () => availableAddons.filter((addon) => selectedAddonIds.includes(addon.id)),
    [availableAddons, selectedAddonIds],
  );

  const minActivityDate = useMemo(() => (dates.start ? formatDateInput(dates.start) : null), [dates.start]);
  const maxActivityDate = useMemo(() => {
    if (!dates.end) return null;
    const candidate = dayBefore(dates.end);
    if (dates.start && candidate < dates.start) {
      return formatDateInput(dates.start);
    }
    return formatDateInput(candidate);
  }, [dates.end, dates.start]);
  const defaultActivityDate = useMemo(() => minActivityDate ?? formatDateInput(new Date()), [minActivityDate]);

  const selectedAddonTotalCents = useMemo(
    () => selectedAddons.reduce((sum, addon) => sum + addon.basePriceCents, 0),
    [selectedAddons],
  );

  const nights = useMemo(() => calculateNights(dates), [dates]);
  const fallbackTotals = useMemo(() => {
    const subtotal = nights * property.price;
    const cleaningFee = CLEANING_FEE;
    const serviceFee = SERVICE_FEE;
    const addons = selectedAddonTotalCents / 100;
    const total = subtotal + cleaningFee + serviceFee + addons;
    return { subtotal, cleaningFee, serviceFee, addons, total };
  }, [nights, property.price, selectedAddonTotalCents]);

  const handleToggleAddon = (addonId: number) => {
    setSelectedAddonIds((current) => {
      if (current.includes(addonId)) {
        setAddonSchedules((prev) => {
          if (!(addonId in prev)) {
            return prev;
          }
          const nextSchedules = { ...prev };
          delete nextSchedules[addonId];
          return nextSchedules;
        });
        return current.filter((id) => id !== addonId);
      }

      setAddonSchedules((prev) => {
        if (prev[addonId]) {
          return prev;
        }
        return {
          ...prev,
          [addonId]: {
            activityDate: defaultActivityDate,
            activityTimeSlot: DEFAULT_ACTIVITY_TIME,
          },
        };
      });

      return [...current, addonId];
    });
  };

  const handleAddonScheduleChange = (addonId: number, schedule: Partial<AddonScheduleValue>) => {
    setAddonSchedules((prev) => {
      const existing = prev[addonId] ?? {
        activityDate: defaultActivityDate,
        activityTimeSlot: DEFAULT_ACTIVITY_TIME,
      };

      const nextDate =
        typeof schedule.activityDate === "string" && schedule.activityDate
          ? schedule.activityDate
          : schedule.activityDate === ""
            ? existing.activityDate
            : schedule.activityDate ?? existing.activityDate;

      const nextTime =
        typeof schedule.activityTimeSlot === "string" && schedule.activityTimeSlot
          ? schedule.activityTimeSlot
          : schedule.activityTimeSlot === ""
            ? existing.activityTimeSlot
            : schedule.activityTimeSlot ?? existing.activityTimeSlot;

      return {
        ...prev,
        [addonId]: {
          activityDate: nextDate,
          activityTimeSlot: nextTime,
        },
      };
    });
  };

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
        addons: addonsFeatureEnabled
          ? selectedAddons.map((addon) => ({
              id: addon.id,
              activityDate: addonSchedules[addon.id]?.activityDate ?? defaultActivityDate,
              activityTimeSlot: addonSchedules[addon.id]?.activityTimeSlot ?? DEFAULT_ACTIVITY_TIME,
            }))
          : undefined,
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

  const continueDisabled = isLoadingIntent || isLoadingAddons;

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
          selectedAddons={selectedAddons}
          addonSchedules={addonSchedules}
          onContinue={step === "details" ? handleRequestContinue : undefined}
          isContinueLoading={isLoadingIntent}
          isContinueDisabled={continueDisabled}
        />
      </div>

      {step === "details" && addonsFeatureEnabled && (
        <section>
          <AddonSelector
            addons={availableAddons}
            selectedIds={selectedAddonIds}
            schedules={addonSchedules}
            onToggle={handleToggleAddon}
            onScheduleChange={handleAddonScheduleChange}
            isLoading={isLoadingAddons}
            error={addonsError}
            minDate={minActivityDate ?? undefined}
            maxDate={maxActivityDate ?? undefined}
          />
        </section>
      )}
      {step === "details" && !addonsFeatureEnabled && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-serif text-2xl text-gray-900">Experiences coming soon</h3>
          <p className="mt-2 text-sm text-gray-500">
            Our curated Viator add-ons are temporarily unavailable for launch. Check back soon for concierge-only
            experiences once we flip them back on.
          </p>
        </section>
      )}
    </div>
  );
}
