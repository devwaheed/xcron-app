import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

/**
 * POST /api/auth/reset-password
 * Triggers a Supabase password reset email.
 * Always returns success to avoid revealing whether the email exists.
 */
export async function POST(request: NextRequest) {
  try {
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

    // Always return success to avoid revealing if the email exists
    return NextResponse.json({ success: true });
  } catch {
    // Still return success to not leak information
    return NextResponse.json({ success: true });
  }
}
