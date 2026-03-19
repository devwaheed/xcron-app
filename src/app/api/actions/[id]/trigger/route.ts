import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseServerClient, getAuthenticatedClient } from '@/lib/supabase-server';
import { createGitHubBridge } from '@/lib/github-bridge';

/**
 * POST /api/actions/[id]/trigger
 * Triggers a workflow run via GitHub workflow dispatch.
 * Called by cron-job.org on schedule, or manually from the dashboard.
 *
 * Two auth paths:
 * 1. cron-job.org: No cookies, validates CRON_SECRET in Authorization header,
 *    uses service role client (bypasses RLS), fetches action's user_id from row.
 * 2. User-initiated: Has cookies, uses getAuthenticatedClient (RLS enforced).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    // Determine if this is a cron-job.org call or a user-initiated call
    let supabase;
    let actionUserId: string | undefined;
    let isCronCall = false;

    // Check for CRON_SECRET auth (cron-job.org path)
    if (authHeader === `Bearer ${cronSecret}` && cronSecret) {
      isCronCall = true;
      supabase = getSupabaseServerClient();
    } else {
      // User-initiated path: authenticate via cookies
      try {
        const cookieStore = await cookies();
        const auth = await getAuthenticatedClient(cookieStore);
        supabase = auth.supabase;
        actionUserId = auth.userId;
      } catch {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Confirm the action exists and check its status
    const { data: existing, error: fetchError } = await supabase
      .from('actions')
      .select('id, status, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    // For cron calls, get the user_id from the action row
    const userId = isCronCall ? existing.user_id : actionUserId!;

    // Reject triggers for paused actions (defense-in-depth: cron-job.org
    // should already be disabled, but guard against race conditions)
    if (existing.status === 'paused') {
      return NextResponse.json(
        { error: 'Action is paused', details: 'Resume the action before triggering it.' },
        { status: 409 }
      );
    }

    const bridge = createGitHubBridge();
    try {
      await bridge.triggerWorkflow(userId, id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: 'GitHub operation failed', details: message },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: 'Workflow triggered successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
