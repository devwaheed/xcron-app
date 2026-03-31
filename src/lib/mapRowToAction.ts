import { Action } from '@/types';

/**
 * Represents a raw row from the Supabase `actions` table.
 */
export interface ActionRow {
  id: string;
  name: string;
  script_content: string;
  days: number[];
  time_hour: number;
  time_minute: number;
  time_period: 'AM' | 'PM';
  timezone: string;
  status: 'active' | 'paused';
  env_vars: Record<string, string> | null;
  timeout_minutes: number | null;
  max_retries: number | null;
  retry_delay_seconds: number | null;
  github_workflow_id: number | null;
  cron_job_id: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

/**
 * Maps a Supabase `actions` row to the `Action` application type.
 */
export function mapRowToAction(row: ActionRow): Action {
  return {
    id: row.id,
    name: row.name,
    scriptContent: row.script_content,
    schedule: {
      days: row.days,
      hour: row.time_hour,
      minute: row.time_minute,
      period: row.time_period,
      timezone: row.timezone,
    },
    status: row.status,
    envVars: row.env_vars ?? {},
    timeoutMinutes: row.timeout_minutes ?? 5,
    maxRetries: row.max_retries ?? 0,
    retryDelaySeconds: row.retry_delay_seconds ?? 60,
    githubWorkflowId: row.github_workflow_id ?? undefined,
    cronJobId: row.cron_job_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}
