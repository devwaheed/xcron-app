// Feature: cron-job-builder, Property 16: Correct file paths in repository
// Feature: cron-job-builder, Property 5: GitHub-first transactional guarantee
// Feature: cron-job-builder, Property 3: Action creation persists to both stores
// Feature: cron-job-builder, Property 7: Action update persists to both stores
// Feature: cron-job-builder, Property 8: Action deletion removes from both stores

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { getScriptPath, getWorkflowPath } from '@/lib/github-bridge';
import type { Action, Schedule } from '@/types';

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => ({
    from: mockFrom,
  }),
}));

const mockCommitScript = vi.fn();
const mockCommitWorkflow = vi.fn();
const mockDeleteScript = vi.fn();
const mockDeleteWorkflow = vi.fn();

vi.mock('@/lib/github-bridge', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/github-bridge')>();
  return {
    ...original,
    createGitHubBridge: () => ({
      commitScript: mockCommitScript,
      commitWorkflow: mockCommitWorkflow,
      deleteScript: mockDeleteScript,
      deleteWorkflow: mockDeleteWorkflow,
    }),
  };
});

vi.mock('@/lib/workflow-generator', () => ({
  generate: () => 'name: mock-workflow\n',
}));

vi.stubGlobal('crypto', {
  ...globalThis.crypto,
  randomUUID: () => 'test-uuid-prop',
});

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

function makePostRequest(body: unknown): Request {
  return new Request('http://localhost/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makePutRequest(body: unknown): Request {
  return new Request('http://localhost/api/actions/some-id', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(): Request {
  return new Request('http://localhost/api/actions/some-id', { method: 'DELETE' });
}

function setupSupabaseFetchExisting(row: Record<string, unknown> | null, error: unknown = null) {
  const singleFn = vi.fn().mockResolvedValue({ data: row, error });
  const eqFn = vi.fn().mockReturnValue({ single: singleFn });
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
  mockFrom.mockReturnValueOnce({ select: selectFn });
}

function setupSupabaseInsert(row: Record<string, unknown> | null, error: unknown = null) {
  const singleFn = vi.fn().mockResolvedValue({ data: row, error });
  const selectFn = vi.fn().mockReturnValue({ single: singleFn });
  const insertFn = vi.fn().mockReturnValue({ select: selectFn });
  mockFrom.mockReturnValueOnce({ insert: insertFn });
}

function setupSupabaseUpdate(row: Record<string, unknown> | null, error: unknown = null) {
  const singleFn = vi.fn().mockResolvedValue({ data: row, error });
  const selectFn = vi.fn().mockReturnValue({ single: singleFn });
  const eqFn = vi.fn().mockReturnValue({ select: selectFn });
  const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
  mockFrom.mockReturnValueOnce({ update: updateFn });
}

function setupSupabaseDelete(error: unknown = null) {
  const eqFn = vi.fn().mockResolvedValue({ error });
  const deleteFn = vi.fn().mockReturnValue({ eq: eqFn });
  mockFrom.mockReturnValueOnce({ delete: deleteFn });
}

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
    created_at: action.createdAt,
    updated_at: action.updatedAt,
  };
}

// ── Property 16: Correct file paths in repository ───────────────────────────

/**
 * Validates: Requirements 11.2, 11.3
 *
 * For any action, the GitHub Bridge should commit the script file to
 * `scripts/{actionId}.js` and the workflow file to
 * `.github/workflows/{actionId}.yml`.
 */
describe('Property 16: Correct file paths in repository', () => {
  it('getScriptPath constructs scripts/{actionId}.js for any action', () => {
    fc.assert(
      fc.property(arbitraryAction, (action) => {
        const scriptPath = getScriptPath(action.id);
        expect(scriptPath).toBe(`scripts/${action.id}.js`);
      }),
      { numRuns: 100 },
    );
  });

  it('getWorkflowPath constructs .github/workflows/{actionId}.yml for any action', () => {
    fc.assert(
      fc.property(arbitraryAction, (action) => {
        const workflowPath = getWorkflowPath(action.id);
        expect(workflowPath).toBe(`.github/workflows/${action.id}.yml`);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 5: GitHub-first transactional guarantee ────────────────────────

/**
 * Validates: Requirements 4.9, 5.4, 6.4
 *
 * For any valid action config, when GitHub fails, Supabase should remain
 * unchanged — no action should be created, updated, or deleted in Supabase.
 */
describe('Property 5: GitHub-first transactional guarantee', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST: when GitHub fails, Supabase is never called', async () => {
    const { POST } = await import('@/app/api/actions/route');

    await fc.assert(
      fc.asyncProperty(arbitraryAction, async (action) => {
        vi.clearAllMocks();
        mockCommitScript.mockRejectedValue(new Error('GitHub down'));

        const body = {
          name: action.name,
          scriptContent: action.scriptContent,
          schedule: action.schedule,
        };
        const response = await POST(makePostRequest(body) as any);

        expect(response.status).toBe(502);
        // Supabase from() should never be called for insert
        expect(mockFrom).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });

  it('PUT: when GitHub fails, Supabase update is never called', async () => {
    const { PUT } = await import('@/app/api/actions/[id]/route');

    await fc.assert(
      fc.asyncProperty(arbitraryAction, async (action) => {
        vi.clearAllMocks();

        // First call: fetch existing action (succeeds)
        setupSupabaseFetchExisting(actionToRow(action));
        // GitHub fails
        mockCommitScript.mockRejectedValue(new Error('GitHub down'));

        const body = {
          name: action.name,
          scriptContent: action.scriptContent,
          schedule: action.schedule,
        };
        const response = await PUT(makePutRequest(body) as any, {
          params: Promise.resolve({ id: action.id }),
        });

        expect(response.status).toBe(502);
        // mockFrom called once for fetch, but NOT a second time for update
        expect(mockFrom).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 },
    );
  });

  it('DELETE: when GitHub fails, Supabase delete is never called', async () => {
    const { DELETE } = await import('@/app/api/actions/[id]/route');

    await fc.assert(
      fc.asyncProperty(arbitraryAction, async (action) => {
        vi.clearAllMocks();

        // First call: fetch existing action (succeeds)
        setupSupabaseFetchExisting(actionToRow(action));
        // GitHub fails
        mockDeleteScript.mockRejectedValue(new Error('GitHub down'));

        const response = await DELETE(makeDeleteRequest() as any, {
          params: Promise.resolve({ id: action.id }),
        });

        expect(response.status).toBe(502);
        // mockFrom called once for fetch, but NOT a second time for delete
        expect(mockFrom).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 3: Action creation persists to both stores ─────────────────────

/**
 * Validates: Requirements 4.6, 4.7
 *
 * For any valid action configuration, submitting the creation form should
 * result in the action being stored in Supabase and the script + workflow
 * files being committed to the GitHub repository.
 */
describe('Property 3: Action creation persists to both stores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCommitScript.mockResolvedValue(undefined);
    mockCommitWorkflow.mockResolvedValue(undefined);
  });

  it('for any valid action config, both GitHubBridge and Supabase are called on create', async () => {
    const { POST } = await import('@/app/api/actions/route');

    await fc.assert(
      fc.asyncProperty(arbitraryAction, async (action) => {
        vi.clearAllMocks();
        mockCommitScript.mockResolvedValue(undefined);
        mockCommitWorkflow.mockResolvedValue(undefined);

        const row = actionToRow({ ...action, id: 'test-uuid-prop' });
        setupSupabaseInsert(row);

        const body = {
          name: action.name,
          scriptContent: action.scriptContent,
          schedule: action.schedule,
        };
        const response = await POST(makePostRequest(body) as any);

        expect(response.status).toBe(201);
        // GitHub was called
        expect(mockCommitScript).toHaveBeenCalledWith('test-uuid-prop', action.scriptContent);
        expect(mockCommitWorkflow).toHaveBeenCalledWith('test-uuid-prop', 'name: mock-workflow\n');
        // Supabase was called
        expect(mockFrom).toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 7: Action update persists to both stores ───────────────────────

/**
 * Validates: Requirements 5.2, 5.3
 *
 * For any valid action update, submitting the edit form should result in
 * the updated configuration being stored in Supabase and the updated
 * script + workflow files being committed to the GitHub repository.
 */
describe('Property 7: Action update persists to both stores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCommitScript.mockResolvedValue(undefined);
    mockCommitWorkflow.mockResolvedValue(undefined);
  });

  it('for any valid action update, both stores are updated', async () => {
    const { PUT } = await import('@/app/api/actions/[id]/route');

    await fc.assert(
      fc.asyncProperty(arbitraryAction, async (action) => {
        vi.clearAllMocks();
        mockCommitScript.mockResolvedValue(undefined);
        mockCommitWorkflow.mockResolvedValue(undefined);

        const existingRow = actionToRow(action);
        // Fetch existing
        setupSupabaseFetchExisting(existingRow);
        // Update returns updated row
        const updatedRow = { ...existingRow, updated_at: new Date().toISOString() };
        setupSupabaseUpdate(updatedRow);

        const body = {
          name: action.name,
          scriptContent: action.scriptContent,
          schedule: action.schedule,
        };
        const response = await PUT(makePutRequest(body) as any, {
          params: Promise.resolve({ id: action.id }),
        });

        expect(response.status).toBe(200);
        // GitHub was called
        expect(mockCommitScript).toHaveBeenCalledWith(action.id, action.scriptContent);
        expect(mockCommitWorkflow).toHaveBeenCalledWith(action.id, 'name: mock-workflow\n');
        // Supabase was called twice: once for fetch, once for update
        expect(mockFrom).toHaveBeenCalledTimes(2);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 8: Action deletion removes from both stores ────────────────────

/**
 * Validates: Requirements 6.2, 6.3
 *
 * For any action, confirming deletion should result in the action being
 * removed from Supabase and the corresponding script + workflow files
 * being deleted from the GitHub repository.
 */
describe('Property 8: Action deletion removes from both stores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteScript.mockResolvedValue(undefined);
    mockDeleteWorkflow.mockResolvedValue(undefined);
  });

  it('for any action, deletion removes from both stores', async () => {
    const { DELETE } = await import('@/app/api/actions/[id]/route');

    await fc.assert(
      fc.asyncProperty(arbitraryAction, async (action) => {
        vi.clearAllMocks();
        mockDeleteScript.mockResolvedValue(undefined);
        mockDeleteWorkflow.mockResolvedValue(undefined);

        const existingRow = actionToRow(action);
        // Fetch existing
        setupSupabaseFetchExisting(existingRow);
        // Delete from Supabase
        setupSupabaseDelete(null);

        const response = await DELETE(makeDeleteRequest() as any, {
          params: Promise.resolve({ id: action.id }),
        });

        expect(response.status).toBe(200);
        // GitHub was called to delete both files
        expect(mockDeleteScript).toHaveBeenCalledWith(action.id);
        expect(mockDeleteWorkflow).toHaveBeenCalledWith(action.id);
        // Supabase was called twice: once for fetch, once for delete
        expect(mockFrom).toHaveBeenCalledTimes(2);
      }),
      { numRuns: 100 },
    );
  });
});
