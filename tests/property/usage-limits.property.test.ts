// Feature: usage-tiers-limits
// Tests for action limit enforcement, run limit enforcement, and usage stats API

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockFrom = vi.fn();
const TEST_USER_ID = 'test-user-usage-1234';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      if (name === 'sb-access-token') return { value: 'mock-token' };
      return undefined;
    },
  })),
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => ({ from: mockFrom }),
  getAuthenticatedClient: vi.fn(async () => ({
    supabase: { from: mockFrom },
    userId: TEST_USER_ID,
  })),
}));

vi.mock('@/lib/github-bridge', () => ({
  createGitHubBridge: () => ({
    commitScript: vi.fn().mockResolvedValue(undefined),
    commitWorkflow: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/lib/workflow-generator', () => ({
  generate: () => 'name: mock\n',
}));

vi.mock('@/lib/cronjob-bridge', () => ({
  createCronJobBridge: () => ({
    createJob: vi.fn().mockResolvedValue(99999),
  }),
}));

vi.stubGlobal('crypto', {
  ...globalThis.crypto,
  randomUUID: () => 'test-uuid-usage',
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function setupUserPlanQuery(maxActions: number, maxRuns: number) {
  // getUserPlan: from('user_plans').select(...).eq(...).single()
  const singleFn = vi.fn().mockResolvedValue({
    data: {
      plan_id: 1,
      billing_cycle_start: new Date().toISOString(),
      stripe_customer_id: null,
      stripe_subscription_id: null,
      plans: {
        name: 'Starter',
        max_actions: maxActions,
        max_runs_per_month: maxRuns,
        log_retention_days: 30,
      },
    },
    error: null,
  });
  const eqFn = vi.fn().mockReturnValue({ single: singleFn });
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
  mockFrom.mockReturnValueOnce({ select: selectFn });
}

function setupCountQuery(count: number) {
  // count query: from('actions'|'runs').select('id', {count}).eq(...).gte(...).lt(...)
  // The chain varies: actions just has .eq(), runs has .eq().gte().lt()
  // We make all methods return the same chainable object with the count result
  const result = { count, error: null };
  const chain: Record<string, unknown> = { ...result };
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lt = vi.fn().mockReturnValue(chain);
  const selectFn = vi.fn().mockReturnValue(chain);
  mockFrom.mockReturnValueOnce({ select: selectFn });
}

function setupInsertQuery() {
  const singleFn = vi.fn().mockResolvedValue({
    data: {
      id: 'test-uuid-usage',
      name: 'Test',
      script_content: 'console.log("hi")',
      days: [1],
      time_hour: 9,
      time_minute: 0,
      time_period: 'AM',
      timezone: 'UTC',
      status: 'active',
      cron_job_id: 99999,
      user_id: TEST_USER_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    error: null,
  });
  const selectFn = vi.fn().mockReturnValue({ single: singleFn });
  const insertFn = vi.fn().mockReturnValue({ select: selectFn });
  mockFrom.mockReturnValueOnce({ insert: insertFn });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Action limit enforcement (POST /api/actions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when action count >= max_actions for any limit', async () => {
    const { POST } = await import('@/app/api/actions/route');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }), // maxActions
        async (maxActions) => {
          vi.clearAllMocks();

          // Setup: user plan with maxActions limit
          setupUserPlanQuery(maxActions, 100);
          // Setup: current count = maxActions (at limit)
          setupCountQuery(maxActions);

          const body = {
            name: 'Test Action',
            scriptContent: 'console.log("test")',
            schedule: { days: [1], hour: 9, minute: 0, period: 'AM', timezone: 'UTC' },
          };

          const req = new Request('http://localhost/api/actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          const res = await POST(req as any);
          expect(res.status).toBe(403);

          const data = await res.json();
          expect(data.error).toBe('Action limit reached');
          expect(data.current).toBe(maxActions);
          expect(data.limit).toBe(maxActions);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('allows creation when action count < max_actions', async () => {
    const { POST } = await import('@/app/api/actions/route');

    vi.clearAllMocks();

    // Setup: user plan with 5 actions limit
    setupUserPlanQuery(5, 100);
    // Setup: current count = 2 (under limit)
    setupCountQuery(2);
    // Setup: Supabase insert
    setupInsertQuery();

    const body = {
      name: 'Test Action',
      scriptContent: 'console.log("test")',
      schedule: { days: [1], hour: 9, minute: 0, period: 'AM', timezone: 'UTC' },
    };

    const req = new Request('http://localhost/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
  });
});

describe('Usage stats API (GET /api/usage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns usage stats for authenticated user', async () => {
    const { GET } = await import('@/app/api/usage/route');

    vi.clearAllMocks();

    // getUserPlan query
    setupUserPlanQuery(5, 100);
    // Action count query
    setupCountQuery(3);
    // Run count query
    setupCountQuery(42);

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.planName).toBe('Starter');
    expect(data.actions.used).toBe(3);
    expect(data.actions.limit).toBe(5);
    expect(data.runs.used).toBe(42);
    expect(data.runs.limit).toBe(100);
    expect(data.billingCycleReset).toBeDefined();
    expect(data.logRetentionDays).toBe(30);
  });
});

describe('Promo code redemption (POST /api/redeem)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 for invalid code', async () => {
    const { POST } = await import('@/app/api/redeem/route');

    vi.clearAllMocks();

    // Lookup returns no result
    const singleFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValueOnce({ select: selectFn });

    const req = new Request('http://localhost/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALID-CODE' }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Invalid code');
  });

  it('returns 409 for already redeemed code', async () => {
    const { POST } = await import('@/app/api/redeem/route');

    vi.clearAllMocks();

    // Lookup returns redeemed code
    const singleFn = vi.fn().mockResolvedValue({
      data: { id: 'code-1', plan_id: 2, redeemed_by: 'other-user' },
      error: null,
    });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValueOnce({ select: selectFn });

    const req = new Request('http://localhost/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'XCRON-T2-ABCD1234' }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('Code already redeemed');
  });
});
