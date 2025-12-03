"use client";

import { useMemo, useState } from "react";
import type { StripeElementsOptions, StripePaymentElementOptions } from "@stripe/stripe-js";
import { AlertCircle, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/shared/Button";
import {
  Elements,
  PaymentElement,
  stripePromise,
  useElements,
  useStripe,
} from "@/lib/stripePlaceholder";

interface PaymentSectionProps {
  clientSecret: string | null;
  amountCents: number;
  currency?: string;
  onSuccess: () => void;
}

const formatAmount = (amountCents: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountCents / 100);

function CheckoutForm({ amountCents, currency, onSuccess }: { amountCents: number; currency: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const formattedAmount = useMemo(() => formatAmount(amountCents, currency), [amountCents, currency]);

  const paymentElementOptions = useMemo<StripePaymentElementOptions>(
    () => ({ layout: "tabs" }),
    [],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setMessage(null);
    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setMessage(error.message ?? "Payment failed. Please verify your card details.");
        return;
      }

      onSuccess();
    } catch (error) {
      const fallbackMessage =
        error instanceof Error ? error.message : "Payment failed. Please try again.";
      setMessage(fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <PaymentElement
        id="payment-element"
        options={paymentElementOptions}
        onReady={() => setIsElementReady(true)}
      />
      <div className="p-4 bg-slate-50 text-slate-700 rounded-xl text-sm flex flex-col gap-1">
        <div className="flex items-center gap-2 font-medium">
          <Info className="w-4 h-4 text-slate-500" /> Stripe sandbox mode
        </div>
        <p className="text-slate-500">
          Use test card <span className="font-semibold">4242 4242 4242 4242</span>, any future expiry, and any CVC
          to simulate a successful charge.
        </p>
      </div>
      {message && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {message}
        </div>
      )}
      <Button disabled={isLoading || !stripe || !elements || !isElementReady} className="w-full">
        {isLoading ? "Processing..." : `Pay ${formattedAmount}`}
      </Button>
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
        <ShieldCheck className="w-3 h-3 text-green-600" /> Payments are processed securely by Stripe.
      </div>
    </form>
  );
}

export function PaymentSection({ clientSecret, amountCents, currency = "USD", onSuccess }: PaymentSectionProps) {
  const elementOptions = useMemo<StripeElementsOptions | undefined>(() => {
    if (!clientSecret) return undefined;
    return {
      clientSecret,
      appearance: {
        theme: "flat",
        rules: {
          ".Label": {
            fontWeight: "500",
          },
        },
        variables: {
          colorPrimary: "#0f172a",
          colorText: "#0f172a",
          colorDanger: "#b91c1c",
          borderRadius: "12px",
        },
      },
    } satisfies StripeElementsOptions;
  }, [clientSecret]);

  if (!elementOptions) return null;

  return (
    <Elements stripe={stripePromise} options={elementOptions} key={clientSecret}>
      <CheckoutForm amountCents={amountCents} currency={currency} onSuccess={onSuccess} />
    </Elements>
  );
}
