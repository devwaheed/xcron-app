import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

/**
 * POST /api/checkout
 * Creates a Stripe Checkout session for purchasing or upgrading a plan.
 */
export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: 'Payments not configured' },
      { status: 501 }
    );
  }

  let supabase;
  let userId: string;

  try {
    const cookieStore = await cookies();
    const auth = await getAuthenticatedClient(cookieStore);
    supabase = auth.supabase;
    userId = auth.userId;
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { plan_id } = body as { plan_id?: number };

    if (!plan_id) {
      return NextResponse.json(
        { error: 'plan_id is required' },
        { status: 400 }
      );
    }

    // Fetch the plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, stripe_price_id')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    if (!plan.stripe_price_id) {
      return NextResponse.json(
        { error: 'Plan does not have Stripe pricing configured' },
        { status: 400 }
      );
    }

    // Look up existing Stripe customer ID
    const { data: userPlan } = await supabase
      .from('user_plans')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    const stripe = new Stripe(stripeKey);
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: `${origin}/dashboard/profile?checkout=success`,
      cancel_url: `${origin}/pricing`,
      metadata: { userId, planId: String(plan_id) },
      client_reference_id: userId,
    };

    // Reuse existing Stripe customer if available
    if (userPlan?.stripe_customer_id) {
      sessionParams.customer = userPlan.stripe_customer_id;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe checkout error:', message);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
