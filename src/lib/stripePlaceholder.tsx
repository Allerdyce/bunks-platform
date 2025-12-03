import { loadStripe } from "@stripe/stripe-js";
export { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set; Stripe Elements will be disabled.');
}

export const stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);
