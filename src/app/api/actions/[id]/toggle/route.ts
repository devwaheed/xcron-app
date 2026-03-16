import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { createGitHubBridge } from '@/lib/github-bridge';
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
  try {
    const { id } = await params;

    const supabase = getSupabaseServerClient();
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
        await bridge.disableWorkflow(id);
      } else {
        await bridge.enableWorkflow(id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: 'GitHub operation failed', details: message },
        { status: 502 }
      );
    }

    // Update status in Supabase
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
