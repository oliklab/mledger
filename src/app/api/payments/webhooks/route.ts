import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with the correct API key and a valid API version.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Use the Supabase Admin client for secure server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const data = event.data.object as any;

  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = data as Stripe.Checkout.Session;
      await handleCheckoutCompleted(checkoutSession);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = data as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(data as Stripe.Subscription);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
//   const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
//   const userId = subscription.metadata!.supabase_user_id;

//   await supabaseAdmin.from('subscriptions').upsert({
//     user_id: userId,
//     stripe_customer_id: session.customer as string,
//     stripe_subscription_id: subscription.id,
//     status: subscription.status,
//     price_id: subscription.items.data[0].price.id,
//     current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
//   });
// }

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Get the user ID from the subscription's metadata
  const userId = subscription.metadata.supabase_user_id;

  // Add a guard clause to ensure the user ID exists.
  // If it doesn't, we throw an error so Stripe will retry the webhook.
  if (!userId) {
    throw new Error("Webhook Error: supabase_user_id not found in subscription metadata.");
  }

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      // This now works correctly because of the UNIQUE constraint you added.
      onConflict: 'user_id'
    });

  if (error) {
    console.error("Error upserting subscription data:", error);
    // Throwing the error is important, as it signals to Stripe to retry the webhook.
    throw error;
  }

  console.log(`Successfully processed subscription ${subscription.id} for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}