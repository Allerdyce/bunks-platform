"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/shared/Button";
import type { NavigateHandler } from "@/types";

interface SuccessViewProps {
  onNavigate: NavigateHandler;
}

export function SuccessView({ onNavigate }: SuccessViewProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl text-gray-900 mb-4">Booking Confirmed!</h1>
      <p className="text-gray-600 max-w-md mb-8">
        Thank you for choosing Bunks. A confirmation email with check-in details has been sent to your inbox.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => onNavigate("booking-details")}>View booking details</Button>
        <Button variant="secondary" onClick={() => onNavigate("home")}>
          Return Home
        </Button>
      </div>
    </div>
  );
}
