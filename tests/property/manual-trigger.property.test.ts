// Feature: cron-job-builder, Property 11: Manual trigger dispatches workflow

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Action, Schedule } from '@/types';

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockFrom = vi.fn();

const TEST_USER_ID = 'test-user-id-1234';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      if (name === 'sb-access-token') return { value: 'mock-token' };
      return undefined;
    },
  })),
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => ({
    from: mockFrom,
  }),
  getAuthenticatedClient: vi.fn(async () => ({
    supabase: { from: mockFrom },
    userId: TEST_USER_ID,
  })),
}));

const mockTriggerWorkflow = vi.fn();

vi.mock('@/lib/github-bridge', () => ({
  createGitHubBridge: () => ({
    triggerWorkflow: mockTriggerWorkflow,
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
  githubWorkflowId: fc.integer({ min: 1, max: 999999 }),
  createdAt: fc
    .integer({ min: 946684800000, max: 1893456000000 })
    .map((ms) => new Date(ms).toISOString()),
  updatedAt: fc
    .integer({ min: 946684800000, max: 1893456000000 })
    .map((ms) => new Date(ms).toISOString()),
  userId: fc.constant(TEST_USER_ID),
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
    user_id: action.userId,
  };
}

function setupSupabaseFetch(row: Record<string, unknown> | null, error: unknown = null) {
  const singleFn = vi.fn().mockResolvedValue({ data: row, error });
  const eqFn = vi.fn().mockReturnValue({ single: singleFn });
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
  mockFrom.mockReturnValueOnce({ select: selectFn });
}

// ── Property 11: Manual trigger dispatches workflow ─────────────────────────

/**
 * Validates: Requirements 8.2
 *
 * For any action with a valid workflow ID, clicking "Run Now" should invoke
 * the GitHub workflow dispatch API for that workflow.
 */
describe('Property 11: Manual trigger dispatches workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTriggerWorkflow.mockResolvedValue(undefined);
  });

  it('for any active action, trigger endpoint calls triggerWorkflow with correct action ID', async () => {
    const { POST } = await import('@/app/api/actions/[id]/trigger/route');

    await fc.assert(
      fc.asyncProperty(
        arbitraryAction.filter((a) => a.status === 'active'),
        async (action) => {
          vi.clearAllMocks();
          mockTriggerWorkflow.mockResolvedValue(undefined);

          setupSupabaseFetch({ id: action.id, status: 'active', user_id: TEST_USER_ID });

          const request = new Request(
            `http://localhost/api/actions/${action.id}/trigger`,
            { method: 'POST' },
          );

          const response = await POST(request as any, {
            params: Promise.resolve({ id: action.id }),
          });

          // Should succeed
          expect(response.status).toBe(200);

          // triggerWorkflow must have been called exactly once with the action's ID
          expect(mockTriggerWorkflow).toHaveBeenCalledTimes(1);
          expect(mockTriggerWorkflow).toHaveBeenCalledWith(TEST_USER_ID, action.id);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('for any paused action, trigger endpoint returns 409 and does not dispatch', async () => {
    const { POST } = await import('@/app/api/actions/[id]/trigger/route');

    await fc.assert(
      fc.asyncProperty(
        arbitraryAction.filter((a) => a.status === 'paused'),
        async (action) => {
          vi.clearAllMocks();
          mockTriggerWorkflow.mockResolvedValue(undefined);

          setupSupabaseFetch({ id: action.id, status: 'paused', user_id: TEST_USER_ID });

          const request = new Request(
            `http://localhost/api/actions/${action.id}/trigger`,
            { method: 'POST' },
          );

          const response = await POST(request as any, {
            params: Promise.resolve({ id: action.id }),
          });

          expect(response.status).toBe(409);
          expect(mockTriggerWorkflow).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('trigger endpoint returns 404 when action does not exist', async () => {
    const { POST } = await import('@/app/api/actions/[id]/trigger/route');

    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (actionId) => {
        vi.clearAllMocks();
        mockTriggerWorkflow.mockResolvedValue(undefined);

        // Supabase returns no data (action not found)
        setupSupabaseFetch(null, { message: 'not found' });

        const request = new Request(
          `http://localhost/api/actions/${actionId}/trigger`,
          { method: 'POST' },
        );

        const response = await POST(request as any, {
          params: Promise.resolve({ id: actionId }),
        });

        expect(response.status).toBe(404);
        // triggerWorkflow should NOT be called for non-existent actions
        expect(mockTriggerWorkflow).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});
