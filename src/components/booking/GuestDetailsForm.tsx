"use client";

import type { FormEvent, RefObject } from "react";
import type { BookingClientState } from "@/types";
import { Button } from "@/components/shared/Button";

interface GuestDetailsFormProps {
  value: BookingClientState;
  maxGuests: number;
  onChange: (value: BookingClientState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  formRef?: RefObject<HTMLFormElement | null>;
  hideSubmitButton?: boolean;
  submitLabel?: string;
}

export function GuestDetailsForm({
  value,
  maxGuests,
  onChange,
  onSubmit,
  isSubmitting,
  formRef,
  hideSubmitButton,
  submitLabel = "Continue to Payment",
}: GuestDetailsFormProps) {
  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            required
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
            value={value.firstName}
            onChange={(event) => onChange({ ...value, firstName: event.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            required
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
            value={value.lastName}
            onChange={(event) => onChange({ ...value, lastName: event.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          required
          type="email"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
          value={value.email}
          onChange={(event) => onChange({ ...value, email: event.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
        <select
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
          value={value.guests}
          onChange={(event) =>
            onChange({ ...value, guests: parseInt(event.target.value, 10) })
          }
        >
          {[...Array(maxGuests)].map((_, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {idx + 1} Guests
            </option>
          ))}
        </select>
      </div>
      {!hideSubmitButton && (
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {submitLabel}
        </Button>
      )}
    </form>
  );
}
