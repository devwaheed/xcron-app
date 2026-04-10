import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedClient } from '@/lib/supabase-server';
import { mapRowToAction } from '@/lib/mapRowToAction';
import { validateSchedule } from '@/lib/schedule-validator';
import { generate } from '@/lib/workflow-generator';
import { createGitHubBridge } from '@/lib/github-bridge';
import { createCronJobBridge } from '@/lib/cronjob-bridge';
import { sanitizeScript } from '@/lib/script-sanitizer';
import type { Action, Schedule } from '@/types';

/**
 * DELETE /api/actions/[id]
 * Deletes an action: GitHub-first (delete script + workflow), then remove from Supabase.
 */
export async function DELETE(
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

    // Fetch existing action to confirm it exists (RLS ensures user can only see their own)
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

    // GitHub-first: delete script and workflow before touching Supabase
    const bridge = createGitHubBridge();
    try {
      await bridge.deleteScript(userId, id);
      await bridge.deleteWorkflow(userId, id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: 'GitHub operation failed', details: message },
        { status: 502 }
      );
    }

    // Delete cron-job.org job if it exists
    if (existing.cron_job_id) {
      try {
        const cronBridge = createCronJobBridge();
        await cronBridge.deleteJob(existing.cron_job_id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('cron-job.org delete failed:', message);
        return NextResponse.json(
          { error: 'Cron job deletion failed', details: message },
          { status: 502 }
        );
      }
    }

    // Delete from Supabase (RLS ensures user can only delete their own)
    const { error: deleteError } = await supabase
      .from('actions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Action deleted successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/actions/[id]
 * Returns a single action by ID, mapped to the Action application type.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const { supabase } = await getAuthenticatedClient(cookieStore);

    const { id } = await params;

    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mapRowToAction(data));
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}

/**
 * PUT /api/actions/[id]
 * Updates an existing action: validates input, commits to GitHub first, then updates Supabase.
 */
export async function PUT(
  request: NextRequest,
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
    const body = await request.json();
    const { name, scriptContent, schedule, envVars, timeoutMinutes, maxRetries, retryDelaySeconds } = body as {
      name?: string;
      scriptContent?: string;
      schedule?: Schedule;
      envVars?: Record<string, string>;
      timeoutMinutes?: number;
      maxRetries?: number;
      retryDelaySeconds?: number;
    };

    const safeEnvVars: Record<string, string> = {};
    if (envVars && typeof envVars === 'object') {
      const entries = Object.entries(envVars);
      if (entries.length > 20) {
        return NextResponse.json({ error: 'Maximum 20 environment variables allowed' }, { status: 400 });
      }
      for (const [k, v] of entries) {
        if (typeof k === 'string' && typeof v === 'string') safeEnvVars[k] = v;
      }
    }
    const safeTimeout = Math.min(30, Math.max(1, timeoutMinutes ?? 5));
    const safeRetries = Math.min(3, Math.max(0, maxRetries ?? 0));
    const safeRetryDelay = Math.min(900, Math.max(0, retryDelaySeconds ?? 60));

    // Basic field presence checks
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Validation failed', fields: ['name is required'] },
        { status: 400 }
      );
    }

    if (!scriptContent || typeof scriptContent !== 'string' || scriptContent.trim() === '') {
      return NextResponse.json(
        { error: 'Validation failed', fields: ['scriptContent is required'] },
        { status: 400 }
      );
    }

    // Sanitize script content
    const sanitizeResult = sanitizeScript(scriptContent);
    if (!sanitizeResult.valid) {
      return NextResponse.json(
        { error: 'Script validation failed', fields: sanitizeResult.errors },
        { status: 400 }
      );
    }
    const cleanScript = sanitizeResult.sanitized;

    if (!schedule) {
      return NextResponse.json(
        { error: 'Validation failed', fields: ['schedule is required'] },
        { status: 400 }
      );
    }

    // Validate schedule
    const validation = validateSchedule(schedule);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', fields: validation.errors },
        { status: 400 }
      );
    }

    // Fetch existing action to confirm it exists (RLS ensures user can only see their own)
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

    // Build updated Action object for workflow generation
    const now = new Date().toISOString();
    const updatedAction: Action = {
      id,
      name: name.trim(),
      scriptContent: cleanScript,
      schedule,
      status: existing.status,
      envVars: safeEnvVars,
      timeoutMinutes: safeTimeout,
      maxRetries: safeRetries,
      retryDelaySeconds: safeRetryDelay,
      githubWorkflowId: existing.github_workflow_id ?? undefined,
      createdAt: existing.created_at,
      updatedAt: now,
      userId,
    };

    // Generate updated workflow YAML
    const workflowYaml = generate(updatedAction, userId);

    // GitHub-first: commit updated script and workflow before touching Supabase
    const bridge = createGitHubBridge();
    try {
      await bridge.commitScript(userId, id, cleanScript);
      await bridge.commitWorkflow(userId, id, workflowYaml);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: 'GitHub operation failed', details: message },
        { status: 502 }
      );
    }

    // Update cron-job.org job schedule
    let cronJobId = existing.cron_job_id;
    try {
      const cronBridge = createCronJobBridge();
      if (cronJobId) {
        await cronBridge.updateJob(cronJobId, id, name.trim(), schedule);
      } else {
        // No existing cron job — create one (backfill for actions created before this feature)
        cronJobId = await cronBridge.createJob(id, name.trim(), schedule, existing.status === 'active', userId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('cron-job.org update failed:', message);
      return NextResponse.json(
        { error: 'Cron job update failed', details: message },
        { status: 502 }
      );
    }

    // Update Supabase (RLS ensures user can only update their own)
    const updatePayload: Record<string, unknown> = {
      name: name.trim(),
      script_content: cleanScript,
      days: schedule.days,
      time_hour: schedule.hour,
      time_minute: schedule.minute,
      time_period: schedule.period,
      timezone: schedule.timezone,
      cron_job_id: cronJobId ?? existing.cron_job_id,
      updated_at: now,
    };

    // Only include new columns if they exist in the DB (migration 005)
    // This prevents errors when the migration hasn't been run yet
    if ('env_vars' in existing || envVars) {
      updatePayload.env_vars = safeEnvVars;
      updatePayload.timeout_minutes = safeTimeout;
      updatePayload.max_retries = safeRetries;
      updatePayload.retry_delay_seconds = safeRetryDelay;
    }

    const { data, error } = await supabase
      .from('actions')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json(mapRowToAction(data));
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
