// src/lib/stripe.ts
import Stripe from 'stripe';

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-10-29.clover';

let stripeClient: Stripe | null = null;

function createStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  // STRIPE_API_HOST/PORT/PROTOCOL let local QA point the client at stripe-mock; never in production.
  const host = process.env.NODE_ENV === 'production' ? undefined : process.env.STRIPE_API_HOST;
  return new Stripe(secret, {
    apiVersion: STRIPE_API_VERSION,
    ...(host
      ? {
          host,
          port: Number(process.env.STRIPE_API_PORT || 443),
          protocol: (process.env.STRIPE_API_PROTOCOL as 'http' | 'https') || 'https',
        }
      : {}),
  });
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = createStripeClient();
  }

  return stripeClient;
}