import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedClient } from '@/lib/supabase-server';
import { getUsageStats } from '@/lib/usage-tracker';

/**
 * GET /api/usage
 * Returns the authenticated user's current usage statistics.
 */
export async function GET() {
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
    const stats = await getUsageStats(supabase, userId);
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}
