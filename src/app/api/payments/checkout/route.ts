import { NewSSRSassClient } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(req: Request) {
  const { priceId } = await req.json();

  const ssr = await NewSSRSassClient()
  const supabase = ssr.SupabaseClient()

  // const { data: { user } } = await supabase.auth.getUser();

  const { data: { user: user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check our subscriptions table for an existing Stripe customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;
    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      allow_promotion_codes: true,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/payments`,
      // Pass the user's ID in the metadata to link the subscription in the webhook
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          supabase_user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}