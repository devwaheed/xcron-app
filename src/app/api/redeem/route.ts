import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedClient, getSupabaseServerClient } from '@/lib/supabase-server';
import { assignPlan, getUserPlan } from '@/lib/usage-tracker';

/**
 * POST /api/redeem
 * Redeems a promotional code to upgrade the user's plan.
 */
export async function POST(request: NextRequest) {
  let userId: string;

  try {
    const cookieStore = await cookies();
    const auth = await getAuthenticatedClient(cookieStore);
    userId = auth.userId;
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { code } = body as { code?: string };

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Use service role client to access promo_codes (RLS blocks user access)
    const serviceClient = getSupabaseServerClient();

    // Look up the code
    const { data: promoCode, error: lookupError } = await serviceClient
      .from('promo_codes')
      .select('id, plan_id, redeemed_by')
      .eq('code', code.trim())
      .single();

    if (lookupError || !promoCode) {
      return NextResponse.json(
        { error: 'Invalid code' },
        { status: 404 }
      );
    }

    if (promoCode.redeemed_by) {
      return NextResponse.json(
        { error: 'Code already redeemed' },
        { status: 409 }
      );
    }

    // Mark code as redeemed
    const { error: redeemError } = await serviceClient
      .from('promo_codes')
      .update({
        redeemed_by: userId,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', promoCode.id)
      .is('redeemed_by', null); // Optimistic lock

    if (redeemError) {
      return NextResponse.json(
        { error: 'Failed to redeem code' },
        { status: 500 }
      );
    }

    // Assign the plan
    await assignPlan(serviceClient, userId, promoCode.plan_id);

    // Fetch updated plan info
    const updatedPlan = await getUserPlan(serviceClient, userId);

    return NextResponse.json({
      planName: updatedPlan.planName,
      maxActions: updatedPlan.maxActions,
      maxRunsPerMonth: updatedPlan.maxRunsPerMonth,
      logRetentionDays: updatedPlan.logRetentionDays,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
