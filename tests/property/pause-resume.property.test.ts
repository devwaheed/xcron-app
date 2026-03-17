// Feature: cron-job-builder, Property 9: Pause/resume round-trip

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Action, Schedule } from '@/types';

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockFrom = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => ({
    from: mockFrom,
  }),
}));

const mockEnableWorkflow = vi.fn();
const mockDisableWorkflow = vi.fn();

vi.mock('@/lib/github-bridge', () => ({
  createGitHubBridge: () => ({
    enableWorkflow: mockEnableWorkflow,
    disableWorkflow: mockDisableWorkflow,
  }),
}));

// ── Generators ──────────────────────────────────────────────────────────────

const IANA_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

const arbitrarySchedule: fc.Arbitrary<Schedule> = fc.record({
  days: fc
    .subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 })
    .map((d) => [...d].sort((a, b) => a - b)),
  hour: fc.integer({ min: 1, max: 12 }),
  minute: fc.integer({ min: 0, max: 59 }),
  period: fc.constantFrom('AM' as const, 'PM' as const),
  timezone: fc.constantFrom(...IANA_TIMEZONES),
});

const arbitraryAction: fc.Arbitrary<Action> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  scriptContent: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
  schedule: arbitrarySchedule,
  status: fc.constantFrom('active' as const, 'paused' as const),
  githubWorkflowId: fc.option(fc.integer({ min: 1, max: 999999 }), { nil: undefined }),
  createdAt: fc
    .integer({ min: 946684800000, max: 1893456000000 })
    .map((ms) => new Date(ms).toISOString()),
  updatedAt: fc
    .integer({ min: 946684800000, max: 1893456000000 })
    .map((ms) => new Date(ms).toISOString()),
});


// ── Helpers ─────────────────────────────────────────────────────────────────

function actionToRow(action: Action): Record<string, unknown> {
  return {
    id: action.id,
    name: action.name,
    script_content: action.scriptContent,
    days: action.schedule.days,
    time_hour: action.schedule.hour,
    time_minute: action.schedule.minute,
    time_period: action.schedule.period,
    timezone: action.schedule.timezone,
    status: action.status,
    github_workflow_id: action.githubWorkflowId ?? null,
    cron_job_id: action.cronJobId ?? null,
    created_at: action.createdAt,
    updated_at: action.updatedAt,
  };
}

function makeToggleRequest(): Request {
  return new Request('http://localhost/api/actions/some-id/toggle', {
    method: 'POST',
  });
}

/**
 * Sets up mockFrom to return a fetch chain that resolves to the given row.
 */
function setupSupabaseFetch(row: Record<string, unknown> | null, error: unknown = null) {
  const singleFn = vi.fn().mockResolvedValue({ data: row, error });
  const eqFn = vi.fn().mockReturnValue({ single: singleFn });
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
  mockFrom.mockReturnValueOnce({ select: selectFn });
}

/**
 * Sets up mockFrom to return an update chain that resolves to the given row.
 */
function setupSupabaseUpdate(row: Record<string, unknown> | null, error: unknown = null) {
  const singleFn = vi.fn().mockResolvedValue({ data: row, error });
  const selectFn = vi.fn().mockReturnValue({ single: singleFn });
  const eqFn = vi.fn().mockReturnValue({ select: selectFn });
  const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
  mockFrom.mockReturnValueOnce({ update: updateFn });
}

// ── Property 9: Pause/resume round-trip ─────────────────────────────────────

/**
 * Validates: Requirements 7.2, 7.3, 7.4, 7.5
 *
 * For any active action, pausing and then resuming it should result in the
 * action returning to active status in Supabase and the GitHub workflow being
 * re-enabled. The action's state should be equivalent to its state before the
 * pause.
 */
describe('Property 9: Pause/resume round-trip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnableWorkflow.mockResolvedValue(undefined);
    mockDisableWorkflow.mockResolvedValue(undefined);
  });

  it('for any active action, pause then resume restores original active status', async () => {
    const { POST } = await import('@/app/api/actions/[id]/toggle/route');

    await fc.assert(
      fc.asyncProperty(
        arbitraryAction.filter((a) => a.status === 'active'),
        async (action) => {
          vi.clearAllMocks();
          mockDisableWorkflow.mockResolvedValue(undefined);
          mockEnableWorkflow.mockResolvedValue(undefined);

          // ── Step 1: Pause (active → paused) ──
          const activeRow = actionToRow(action);
          setupSupabaseFetch(activeRow); // fetch existing active action
          const pausedRow = { ...activeRow, status: 'paused' };
          setupSupabaseUpdate(pausedRow); // update returns paused row

          const pauseResponse = await POST(makeToggleRequest() as any, {
            params: Promise.resolve({ id: action.id }),
          });

          expect(pauseResponse.status).toBe(200);
          const pausedBody = await pauseResponse.json();
          expect(pausedBody.status).toBe('paused');

          // Verify disableWorkflow was called
          expect(mockDisableWorkflow).toHaveBeenCalledWith(action.id);
          expect(mockEnableWorkflow).not.toHaveBeenCalled();

          // ── Step 2: Resume (paused → active) ──
          setupSupabaseFetch(pausedRow); // fetch existing paused action
          const resumedRow = { ...activeRow, status: 'active' };
          setupSupabaseUpdate(resumedRow); // update returns active row

          const resumeResponse = await POST(makeToggleRequest() as any, {
            params: Promise.resolve({ id: action.id }),
          });

          expect(resumeResponse.status).toBe(200);
          const resumedBody = await resumeResponse.json();
          expect(resumedBody.status).toBe('active');

          // Verify enableWorkflow was called on resume
          expect(mockEnableWorkflow).toHaveBeenCalledWith(action.id);

          // Round-trip: status is back to active
          expect(resumedBody.status).toBe(action.status);
          // Core fields unchanged
          expect(resumedBody.name).toBe(action.name);
          expect(resumedBody.id).toBe(action.id);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('pause calls disableWorkflow and resume calls enableWorkflow in correct order', async () => {
    const { POST } = await import('@/app/api/actions/[id]/toggle/route');

    await fc.assert(
      fc.asyncProperty(
        arbitraryAction.filter((a) => a.status === 'active'),
        async (action) => {
          vi.clearAllMocks();
          const callOrder: string[] = [];
          mockDisableWorkflow.mockImplementation(async () => {
            callOrder.push('disable');
          });
          mockEnableWorkflow.mockImplementation(async () => {
            callOrder.push('enable');
          });

          const activeRow = actionToRow(action);

          // Pause
          setupSupabaseFetch(activeRow);
          setupSupabaseUpdate({ ...activeRow, status: 'paused' });
          await POST(makeToggleRequest() as any, {
            params: Promise.resolve({ id: action.id }),
          });

          // Resume
          setupSupabaseFetch({ ...activeRow, status: 'paused' });
          setupSupabaseUpdate({ ...activeRow, status: 'active' });
          await POST(makeToggleRequest() as any, {
            params: Promise.resolve({ id: action.id }),
          });

          // Verify the GitHub API calls happened in the correct order
          expect(callOrder).toEqual(['disable', 'enable']);
        },
      ),
      { numRuns: 100 },
    );
  });
});
