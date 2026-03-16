import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { createGitHubBridge } from '@/lib/github-bridge';

/**
 * POST /api/actions/[id]/trigger
 * Manually triggers a workflow run via GitHub workflow dispatch.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Confirm the action exists
    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from('actions')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
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
