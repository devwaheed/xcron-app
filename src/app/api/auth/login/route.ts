import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { assignPlan } from '@/lib/usage-tracker';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';

/**
 * POST /api/auth/login
 * Handles both sign-in and sign-up.
 * For signup: validates promo code (if provided) before creating the account.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`auth:${ip}`, RATE_LIMITS.auth);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } }
      );
    }

    const body = await request.json();
    const { email, password, signup, plan_id, promo_code, display_name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const displayName = display_name || email.split("@")[0];

    const supabase = getSupabaseServerClient();

    // --- SIGNUP FLOW ---
    if (signup) {
      const planId = plan_id ?? 1;

      // Validate promo code BEFORE creating the account
      let promoRecord: { id: number; plan_id: number } | null = null;
      if (promo_code) {
        const { data: code, error: codeErr } = await supabase
          .from('promo_codes')
          .select('id, plan_id, redeemed_by')
          .eq('code', promo_code.trim())
          .single();

        if (codeErr || !code) {
          return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
        }
        if (code.redeemed_by) {
          return NextResponse.json({ error: 'Promo code already redeemed' }, { status: 400 });
        }
        promoRecord = { id: code.id, plan_id: code.plan_id };
      }

      // Create the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError || !signUpData.session) {
        return NextResponse.json(
          { error: signUpError?.message || 'Signup failed' },
          { status: 400 }
        );
      }

      const userId = signUpData.user?.id;
      if (userId) {
        // Assign the selected plan (or promo plan if code provided)
        const targetPlanId = promoRecord ? promoRecord.plan_id : planId;
        try {
          await assignPlan(supabase, userId, targetPlanId);
        } catch {
          // user_plans row may not exist yet if the DB trigger hasn't fired;
          // in that case insert it directly
          await supabase.from('user_plans').upsert({
            user_id: userId,
            plan_id: targetPlanId,
            billing_cycle_start: new Date().toISOString(),
          });
        }

        // Mark promo code as redeemed
        if (promoRecord) {
          await supabase
            .from('promo_codes')
            .update({ redeemed_by: userId, redeemed_at: new Date().toISOString() })
            .eq('id', promoRecord.id)
            .is('redeemed_by', null);
        }

        // Send welcome email (non-blocking)
        sendWelcomeEmail(email, displayName).catch(() => {});
      }

      const response = NextResponse.json({ success: true });
      setSessionCookies(response, signUpData.session);
      return response;
    }

    // --- LOGIN FLOW ---
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    setSessionCookies(response, data.session);
    return response;
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

function setSessionCookies(
  response: NextResponse,
  session: { access_token: string; expires_in: number; refresh_token?: string }
) {
  response.cookies.set('sb-access-token', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: session.expires_in,
  });

  if (session.refresh_token) {
    response.cookies.set('sb-refresh-token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}
