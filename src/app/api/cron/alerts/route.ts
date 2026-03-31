import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { createGitHubBridge } from '@/lib/github-bridge';
import { sendJobFailureAlert } from '@/lib/email';

/**
 * POST /api/cron/alerts
 * Checks recent runs for failures and sends email alerts.
 * Should be called every 10-15 minutes via cron-job.org.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServerClient();

    // Get all active actions with their user info
    const { data: actions, error } = await supabase
      .from('actions')
      .select('id, name, user_id, status')
      .eq('status', 'active');

    if (error || !actions) {
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
    }

    let alertsSent = 0;
    const bridge = createGitHubBridge();

    for (const action of actions) {
      try {
        // Get the latest run
        const runs = await bridge.getWorkflowRuns(action.user_id, action.id, 1);
        if (runs.length === 0) continue;

        const latestRun = runs[0];
        if (latestRun.status !== 'failure') continue;

        // Check if we already alerted for this run (use a simple time window — last 30 min)
        const runTime = new Date(latestRun.timestamp).getTime();
        const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
        if (runTime < thirtyMinAgo) continue;

        // Get user email from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', action.user_id)
          .single();

        if (profile?.email) {
          await sendJobFailureAlert(profile.email, action.name, latestRun.output, action.id);
          alertsSent++;
        }
      } catch {
        // Skip individual action failures
      }
    }

    return NextResponse.json({ message: 'Alert check complete', alertsSent });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
