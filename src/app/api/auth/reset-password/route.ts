import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/reset-password
 * Triggers a Supabase password reset email.
 * Always returns success to avoid revealing whether the email exists.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`reset:${ip}`, RATE_LIMITS.passwordReset);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 300) } }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
