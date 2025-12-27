"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import type { BookingBreakdown, Property } from "@/types";
import { Button } from "@/components/shared/Button";

interface BookingSummaryProps {
  property: Property;
  nights: number;
  breakdown?: BookingBreakdown | null;
  fallbackPricing: {
    nightlyRate: number;
    cleaningFee: number;
    serviceFee: number;
    undiscountedNightlyRate?: number;
  };
  currency?: string;
  onContinue?: () => void;
  continueLabel?: string;
  isContinueLoading?: boolean;
  isContinueDisabled?: boolean;
}

const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const centsToMajor = (cents: number) => cents / 100;

export function BookingSummary({
  property,
  nights,
  breakdown,
  fallbackPricing,
  currency = "USD",
  onContinue,
  continueLabel = "Continue to Payment",
  isContinueLoading,
  isContinueDisabled,
}: BookingSummaryProps) {
  const hasBreakdown = Boolean(breakdown);
  const nightlySubtotal = hasBreakdown
    ? centsToMajor(breakdown!.nightlySubtotalCents)
    : property.price * nights;
  const cleaningFee = hasBreakdown
    ? centsToMajor(breakdown!.cleaningFeeCents)
    : fallbackPricing.cleaningFee;
  const serviceFee = hasBreakdown
    ? centsToMajor(breakdown!.serviceFeeCents)
    : fallbackPricing.serviceFee;

  const tax = hasBreakdown
    ? centsToMajor(breakdown!.taxCents)
    : 0;

  const total = nightlySubtotal + cleaningFee + serviceFee + tax;

  // Strikethrough Logic
  const undiscountedNightlySubtotal = hasBreakdown && breakdown?.undiscountedNightlySubtotalCents
    ? centsToMajor(breakdown.undiscountedNightlySubtotalCents)
    : fallbackPricing.undiscountedNightlyRate
      ? fallbackPricing.undiscountedNightlyRate * nights
      : 0;

  const hasDiscount = undiscountedNightlySubtotal > nightlySubtotal;

  const undiscountedTotal = hasDiscount
    ? undiscountedNightlySubtotal + cleaningFee + serviceFee + tax
    : 0;

  const perNightLabel = hasBreakdown
    ? "Nightly subtotal"
    : `${formatCurrency(fallbackPricing.nightlyRate, currency)} x ${nights} nights`;
  const grandTotal = total;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 h-fit shadow-sm sticky top-24">
      <div className="flex gap-4 mb-6">
        <Image
          src={property.image}
          alt={property.name}
          width={96}
          height={96}
          className="w-24 h-24 object-cover rounded-lg"
        />
        <div>
          <h4 className="font-serif text-gray-900">{property.name}</h4>
          <p className="text-sm text-gray-500">{property.location}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Star className="w-3 h-3 fill-current" /> {property.rating} ({property.reviews})
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 space-y-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>{perNightLabel}</span>
          <div className="flex flex-col items-end">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(undiscountedNightlySubtotal, currency)}
              </span>
            )}
            <span>{formatCurrency(nightlySubtotal, currency)}</span>
          </div>
        </div>
        {cleaningFee > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Cleaning fee</span>
            <span>{formatCurrency(cleaningFee, currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Service fee</span>
          <span>{formatCurrency(serviceFee, currency)}</span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Taxes</span>
            <span>{formatCurrency(tax, currency)}</span>
          </div>
        )}
      </div>
      <div className="border-t border-gray-100 pt-4 mt-2 space-y-4">
        <div className="flex justify-between font-medium text-lg text-gray-900">
          <span>Total</span>
          <div className="flex flex-col items-end">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(undiscountedTotal, currency)}
              </span>
            )}
            <span>{formatCurrency(grandTotal, currency)}</span>
          </div>
        </div>
        {onContinue && (
          <Button
            type="button"
            onClick={onContinue}
            isLoading={isContinueLoading}
            disabled={isContinueDisabled}
            className="w-full"
          >
            {continueLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
