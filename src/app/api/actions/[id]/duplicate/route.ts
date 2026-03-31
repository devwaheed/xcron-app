import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedClient } from '@/lib/supabase-server';
import { mapRowToAction } from '@/lib/mapRowToAction';
import { generate } from '@/lib/workflow-generator';
import { createGitHubBridge } from '@/lib/github-bridge';
import { createCronJobBridge } from '@/lib/cronjob-bridge';
import { checkActionLimit } from '@/lib/usage-tracker';
import type { Action } from '@/types';

/**
 * POST /api/actions/[id]/duplicate
 * Duplicates an existing action with " (copy)" appended to the name.
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
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check action limit
    try {
      const limitCheck = await checkActionLimit(supabase, userId);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { error: 'Action limit reached', current: limitCheck.current, limit: limitCheck.limit },
          { status: 403 }
        );
      }
    } catch { /* graceful degradation */ }

    // Fetch the source action
    const { data: source, error: fetchError } = await supabase
      .from('actions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !source) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newName = `${source.name} (copy)`;

    const newAction: Action = {
      id: newId,
      name: newName,
      scriptContent: source.script_content,
      schedule: {
        days: source.days,
        hour: source.time_hour,
        minute: source.time_minute,
        period: source.time_period,
        timezone: source.timezone,
      },
      status: 'paused',
      envVars: source.env_vars ?? {},
      timeoutMinutes: source.timeout_minutes ?? 5,
      maxRetries: source.max_retries ?? 0,
      retryDelaySeconds: source.retry_delay_seconds ?? 60,
      createdAt: now,
      updatedAt: now,
      userId,
    };

    // Commit to GitHub
    const bridge = createGitHubBridge();
    const workflowYaml = generate(newAction, userId);
    try {
      await bridge.commitScript(userId, newId, source.script_content);
      await bridge.commitWorkflow(userId, newId, workflowYaml);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json({ error: 'GitHub operation failed', details: message }, { status: 502 });
    }

    // Create cron job (paused)
    let cronJobId: number | undefined;
    try {
      const cronBridge = createCronJobBridge();
      cronJobId = await cronBridge.createJob(newId, newName, newAction.schedule, false, userId);
    } catch (err) {
      console.error('cron-job.org create failed:', err instanceof Error ? err.message : err);
    }

    // Insert into DB
    const { data, error } = await supabase
      .from('actions')
      .insert({
        id: newId,
        name: newName,
        script_content: source.script_content,
        days: source.days,
        time_hour: source.time_hour,
        time_minute: source.time_minute,
        time_period: source.time_period,
        timezone: source.timezone,
        status: 'paused',
        env_vars: source.env_vars ?? {},
        timeout_minutes: source.timeout_minutes ?? 5,
        max_retries: source.max_retries ?? 0,
        retry_delay_seconds: source.retry_delay_seconds ?? 60,
        cron_job_id: cronJobId ?? null,
        user_id: userId,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(mapRowToAction(data), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
