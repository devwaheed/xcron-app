import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

/**
 * POST /api/cron/cleanup
 * Deletes expired run logs based on each user's plan log_retention_days.
 * Protected by CRON_SECRET (same pattern as trigger route).
 * Schedule via cron-job.org to run once daily.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const supabase = getSupabaseServerClient();

    // Get all user plans with their retention settings
    const { data: userPlans, error: planError } = await supabase
      .from('user_plans')
      .select(`
        user_id,
        plans ( log_retention_days )
      `);

    if (planError || !userPlans) {
      return NextResponse.json(
        { error: 'Failed to fetch user plans' },
        { status: 500 }
      );
    }

    let totalDeleted = 0;

    for (const up of userPlans) {
      const plan = up.plans as unknown as { log_retention_days: number };
      if (!plan) continue;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - plan.log_retention_days);

      const { count, error: delError } = await supabase
        .from('runs')
        .delete({ count: 'exact' })
        .eq('user_id', up.user_id)
        .lt('triggered_at', cutoff.toISOString());

      if (!delError && count) {
        totalDeleted += count;
      }
    }

    return NextResponse.json({
      message: 'Cleanup complete',
      deletedRuns: totalDeleted,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
