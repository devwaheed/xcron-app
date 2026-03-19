import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { assignPlan } from '@/lib/usage-tracker';

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events for plan management.
 * Uses raw body for signature verification.
 */
export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'Payments not configured' },
      { status: 501 }
    );
  }

  const stripe = new Stripe(stripeKey);
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  try {
    await handleStripeEvent(event, stripe, supabase);
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return NextResponse.json({ received: true });
}

async function handleStripeEvent(
  event: Stripe.Event,
  stripe: Stripe,
  supabase: ReturnType<typeof getSupabaseServerClient>
) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const planId = session.metadata?.planId;

      if (!userId || !planId) {
        console.error('Missing userId or planId in checkout session');
        return;
      }

      // Assign the plan
      await assignPlan(supabase, userId, parseInt(planId, 10));

      // Store Stripe IDs
      await supabase
        .from('user_plans')
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq('user_id', userId);

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by stripe_customer_id
      const { data: userPlan } = await supabase
        .from('user_plans')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (!userPlan) return;

      // Get the new price ID from the subscription
      const newPriceId = subscription.items.data[0]?.price?.id;
      if (!newPriceId) return;

      // Find the plan matching this price
      const { data: plan } = await supabase
        .from('plans')
        .select('id')
        .eq('stripe_price_id', newPriceId)
        .single();

      if (plan) {
        await assignPlan(supabase, userPlan.user_id, plan.id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: userPlan } = await supabase
        .from('user_plans')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (userPlan) {
        // Downgrade to Tier 1
        await assignPlan(supabase, userPlan.user_id, 1);
        await supabase
          .from('user_plans')
          .update({ stripe_subscription_id: null })
          .eq('user_id', userPlan.user_id);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.warn('Payment failed for customer:', paymentIntent.customer);
      // No plan change — retain current plan
      break;
    }

    default:
      // Unhandled event type
      break;
  }
}
