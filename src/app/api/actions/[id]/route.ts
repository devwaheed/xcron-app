import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { mapRowToAction } from '@/lib/mapRowToAction';
import { validateSchedule } from '@/lib/schedule-validator';
import { generate } from '@/lib/workflow-generator';
import { createGitHubBridge } from '@/lib/github-bridge';
import { createCronJobBridge } from '@/lib/cronjob-bridge';
import type { Action, Schedule } from '@/types';

/**
 * DELETE /api/actions/[id]
 * Deletes an action: GitHub-first (delete script + workflow), then remove from Supabase.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch existing action to confirm it exists
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

    // GitHub-first: delete script and workflow before touching Supabase
    const bridge = createGitHubBridge();
    try {
      await bridge.deleteScript(id);
      await bridge.deleteWorkflow(id);
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

    // Delete from Supabase
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
    const { id } = await params;

    const supabase = getSupabaseServerClient();
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
      { error: 'Database error' },
      { status: 500 }
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
  try {
    const { id } = await params;
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

    // Fetch existing action to confirm it exists
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

    // Build updated Action object for workflow generation
    const now = new Date().toISOString();
    const updatedAction: Action = {
      id,
      name: name.trim(),
      scriptContent,
      schedule,
      status: existing.status,
      githubWorkflowId: existing.github_workflow_id ?? undefined,
      createdAt: existing.created_at,
      updatedAt: now,
    };

    // Generate updated workflow YAML
    const workflowYaml = generate(updatedAction);

    // GitHub-first: commit updated script and workflow before touching Supabase
    const bridge = createGitHubBridge();
    try {
      await bridge.commitScript(id, scriptContent);
      await bridge.commitWorkflow(id, workflowYaml);
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
        cronJobId = await cronBridge.createJob(id, name.trim(), schedule, existing.status === 'active');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('cron-job.org update failed:', message);
      return NextResponse.json(
        { error: 'Cron job update failed', details: message },
        { status: 502 }
      );
    }

    // Update Supabase
    const { data, error } = await supabase
      .from('actions')
      .update({
        name: name.trim(),
        script_content: scriptContent,
        days: schedule.days,
        time_hour: schedule.hour,
        time_minute: schedule.minute,
        time_period: schedule.period,
        timezone: schedule.timezone,
        cron_job_id: cronJobId ?? existing.cron_job_id,
        updated_at: now,
      })
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
