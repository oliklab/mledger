import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

// Client-side Stripe
import { loadStripe, Stripe as StripeType } from '@stripe/stripe-js';

let stripePromise: Promise<StripeType | null>;

export const getStripe = (): Promise<StripeType | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};