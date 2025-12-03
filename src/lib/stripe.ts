// src/lib/stripe.ts
import Stripe from 'stripe';

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-10-29.clover';

let stripeClient: Stripe | null = null;

function createStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  return new Stripe(secret, {
    apiVersion: STRIPE_API_VERSION,
  });
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = createStripeClient();
  }

  return stripeClient;
}