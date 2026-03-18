import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { createGitHubBridge } from '@/lib/github-bridge';

/**
 * POST /api/actions/[id]/trigger
 * Triggers a workflow run via GitHub workflow dispatch.
 * Called by cron-job.org on schedule, or manually from the dashboard.
 * When CRON_SECRET is set, requests from cron-job.org must include
 * the Authorization: Bearer <secret> header.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check: if CRON_SECRET is set, validate it.
    // Skip auth check for requests coming from the app itself (they use cookies).
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const hasCookies = request.headers.has('cookie');

    if (cronSecret && !hasCookies) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { id } = await params;

    // Confirm the action exists and check its status
    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from('actions')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

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
      await bridge.triggerWorkflow(id);
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
