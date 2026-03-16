import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { createGitHubBridge } from '@/lib/github-bridge';

const MAX_ENTRIES = 100;

/**
 * GET /api/actions/[id]/runs
 * Fetches run history from GitHub Actions API with pagination and optional status filter.
 * Caps results at 100 entries per action.
 */
export async function GET(
  request: NextRequest,
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const status = searchParams.get('status') ?? undefined;

    const bridge = createGitHubBridge();
    try {
      const runs = await bridge.getWorkflowRuns(id, page, status);
      return NextResponse.json(runs.slice(0, MAX_ENTRIES));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: 'GitHub operation failed', details: message },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
