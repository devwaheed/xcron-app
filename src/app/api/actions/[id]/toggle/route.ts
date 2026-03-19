import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedClient } from '@/lib/supabase-server';
import { createGitHubBridge } from '@/lib/github-bridge';
import { createCronJobBridge } from '@/lib/cronjob-bridge';
import { mapRowToAction } from '@/lib/mapRowToAction';

/**
 * POST /api/actions/[id]/toggle
 * Toggles an action between active and paused states.
 * If active → disable workflow via GitHub, update status to "paused" in Supabase.
 * If paused → enable workflow via GitHub, update status to "active" in Supabase.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  let supabase;

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
    const { id } = await params;

    // Fetch existing action (RLS ensures user can only see their own)
    const { data: existing, error: fetchError } = await supabase
      .from('actions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    const bridge = createGitHubBridge();
    const newStatus = existing.status === 'active' ? 'paused' : 'active';

    // GitHub-first: toggle workflow before updating Supabase
    try {
      if (newStatus === 'paused') {
        await bridge.disableWorkflow(userId, id);
      } else {
        await bridge.enableWorkflow(userId, id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: 'GitHub operation failed', details: message },
        { status: 502 }
      );
    }

    // Toggle cron-job.org job if it exists
    if (existing.cron_job_id) {
      try {
        const cronBridge = createCronJobBridge();
        if (newStatus === 'paused') {
          await cronBridge.disableJob(existing.cron_job_id);
        } else {
          await cronBridge.enableJob(existing.cron_job_id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('cron-job.org toggle failed:', message);
        return NextResponse.json(
          { error: 'Cron job toggle failed', details: message },
          { status: 502 }
        );
      }
    }

    // Update status in Supabase (RLS ensures user can only update their own)
    const { data, error: updateError } = await supabase
      .from('actions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json(mapRowToAction(data));
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
