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
  github_workflow_id: number | null;
  created_at: string;
  updated_at: string;
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
    githubWorkflowId: row.github_workflow_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
