import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedClient } from '@/lib/supabase-server';
import { mapRowToAction } from '@/lib/mapRowToAction';
import { validateSchedule } from '@/lib/schedule-validator';
import { generate } from '@/lib/workflow-generator';
import { createGitHubBridge } from '@/lib/github-bridge';
import { createCronJobBridge } from '@/lib/cronjob-bridge';
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
    const body = await request.json();
    const { name, scriptContent, schedule } = body as {
      name?: string;
      scriptContent?: string;
      schedule?: Schedule;
    };

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
      scriptContent,
      schedule,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      userId,
    };

    // Generate workflow YAML
    const workflowYaml = generate(action, userId);

    // GitHub-first: commit script and workflow before touching Supabase
    const bridge = createGitHubBridge();
    try {
      await bridge.commitScript(userId, actionId, scriptContent);
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
        script_content: scriptContent,
        days: schedule.days,
        time_hour: schedule.hour,
        time_minute: schedule.minute,
        time_period: schedule.period,
        timezone: schedule.timezone,
        status: 'active',
        cron_job_id: cronJobId ?? null,
        user_id: userId,
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
