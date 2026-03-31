import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedClient } from '@/lib/supabase-server';
import { mapRowToAction } from '@/lib/mapRowToAction';
import { validateSchedule } from '@/lib/schedule-validator';
import { generate } from '@/lib/workflow-generator';
import { createGitHubBridge } from '@/lib/github-bridge';
import { createCronJobBridge } from '@/lib/cronjob-bridge';
import { checkActionLimit } from '@/lib/usage-tracker';
import { sanitizeScript } from '@/lib/script-sanitizer';
import type { Action, Schedule } from '@/types';

/**
 * GET /api/actions
 * Returns all actions from Supabase, mapped to the Action application type.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const { supabase } = await getAuthenticatedClient(cookieStore);

    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    const actions = (data ?? []).map(mapRowToAction);
    return NextResponse.json(actions);
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}

/**
 * POST /api/actions
 * Creates a new action: validates input, commits to GitHub first, then inserts into Supabase.
 */
export async function POST(request: NextRequest) {
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
    // Check action limit before processing
    try {
      const limitCheck = await checkActionLimit(supabase, userId);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { error: 'Action limit reached', current: limitCheck.current, limit: limitCheck.limit },
          { status: 403 }
        );
      }
    } catch {
      // If usage tracking fails, allow the action (graceful degradation)
      console.error('Usage tracking unavailable, allowing action creation');
    }

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

    // Validate env vars
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

    // Generate a new action ID
    const actionId = crypto.randomUUID();

    // Build the Action object for workflow generation
    const now = new Date().toISOString();
    const action: Action = {
      id: actionId,
      name: name.trim(),
      scriptContent: cleanScript,
      schedule,
      status: 'active',
      envVars: safeEnvVars,
      timeoutMinutes: safeTimeout,
      maxRetries: safeRetries,
      retryDelaySeconds: safeRetryDelay,
      createdAt: now,
      updatedAt: now,
      userId,
    };

    // Generate workflow YAML
    const workflowYaml = generate(action, userId);

    // GitHub-first: commit script and workflow before touching Supabase
    const bridge = createGitHubBridge();
    try {
      await bridge.commitScript(userId, actionId, cleanScript);
      await bridge.commitWorkflow(userId, actionId, workflowYaml);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: 'GitHub operation failed', details: message },
        { status: 502 }
      );
    }

    // Create cron-job.org job for reliable scheduling
    let cronJobId: number | undefined;
    try {
      const cronBridge = createCronJobBridge();
      cronJobId = await cronBridge.createJob(actionId, name.trim(), schedule, true, userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('cron-job.org create failed:', message);
      return NextResponse.json(
        { error: 'Cron job creation failed', details: message },
        { status: 502 }
      );
    }

    const { data, error } = await supabase
      .from('actions')
      .insert({
        id: actionId,
        name: name.trim(),
        script_content: cleanScript,
        days: schedule.days,
        time_hour: schedule.hour,
        time_minute: schedule.minute,
        time_period: schedule.period,
        timezone: schedule.timezone,
        status: 'active',
        cron_job_id: cronJobId ?? null,
        user_id: userId,
        env_vars: safeEnvVars,
        timeout_minutes: safeTimeout,
        max_retries: safeRetries,
        retry_delay_seconds: safeRetryDelay,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json(mapRowToAction(data), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
