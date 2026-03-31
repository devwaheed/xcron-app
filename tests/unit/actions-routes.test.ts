import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapRowToAction, ActionRow } from '@/lib/mapRowToAction';

// Mock supabase-server before importing routes
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
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

// Mock GitHub bridge
const mockCommitScript = vi.fn();
const mockCommitWorkflow = vi.fn();
const mockDeleteScript = vi.fn();
const mockDeleteWorkflow = vi.fn();
const mockEnableWorkflow = vi.fn();
const mockDisableWorkflow = vi.fn();
const mockTriggerWorkflow = vi.fn();
const mockGetWorkflowRuns = vi.fn();

vi.mock('@/lib/github-bridge', () => ({
  createGitHubBridge: () => ({
    commitScript: mockCommitScript,
    commitWorkflow: mockCommitWorkflow,
    deleteScript: mockDeleteScript,
    deleteWorkflow: mockDeleteWorkflow,
    enableWorkflow: mockEnableWorkflow,
    disableWorkflow: mockDisableWorkflow,
    triggerWorkflow: mockTriggerWorkflow,
    getWorkflowRuns: mockGetWorkflowRuns,
  }),
}));

// Mock cron job bridge
const mockCreateJob = vi.fn().mockResolvedValue(99999);
const mockUpdateJob = vi.fn().mockResolvedValue(undefined);
const mockDeleteJob = vi.fn().mockResolvedValue(undefined);
const mockEnableJob = vi.fn().mockResolvedValue(undefined);
const mockDisableJob = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/cronjob-bridge', () => ({
  createCronJobBridge: () => ({
    createJob: mockCreateJob,
    updateJob: mockUpdateJob,
    deleteJob: mockDeleteJob,
    enableJob: mockEnableJob,
    disableJob: mockDisableJob,
  }),
}));

// Mock workflow generator
vi.mock('@/lib/workflow-generator', () => ({
  generate: () => 'name: mock-workflow\n',
}));

// Mock usage tracker to always allow (not the focus of these tests)
vi.mock('@/lib/usage-tracker', () => ({
  checkActionLimit: vi.fn().mockResolvedValue({ allowed: true, current: 0, limit: 50 }),
  checkRunLimit: vi.fn().mockResolvedValue({ allowed: true, current: 0, limit: 2000 }),
  recordRun: vi.fn().mockResolvedValue(undefined),
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  ...globalThis.crypto,
  randomUUID: () => 'test-uuid-1234',
});

function makeRow(overrides: Partial<ActionRow> = {}): ActionRow {
  return {
    id: 'abc-123',
    name: 'Test Action',
    script_content: 'console.log("hi")',
    days: [1, 3, 5],
    time_hour: 9,
    time_minute: 30,
    time_period: 'AM',
    timezone: 'America/New_York',
    status: 'active',
    github_workflow_id: 42,
    cron_job_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    user_id: TEST_USER_ID,
    env_vars: null,
    timeout_minutes: null,
    max_retries: null,
    retry_delay_seconds: null,
    ...overrides,
  };
}

describe('mapRowToAction', () => {
  it('maps all fields correctly', () => {
    const row = makeRow();
    const action = mapRowToAction(row);

    expect(action).toEqual({
      id: 'abc-123',
      name: 'Test Action',
      scriptContent: 'console.log("hi")',
      schedule: {
        days: [1, 3, 5],
        hour: 9,
        minute: 30,
        period: 'AM',
        timezone: 'America/New_York',
      },
      status: 'active',
      envVars: {},
      timeoutMinutes: 5,
      maxRetries: 0,
      retryDelaySeconds: 60,
      githubWorkflowId: 42,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      userId: TEST_USER_ID,
    });
  });

  it('maps null github_workflow_id to undefined', () => {
    const row = makeRow({ github_workflow_id: null });
    const action = mapRowToAction(row);
    expect(action.githubWorkflowId).toBeUndefined();
  });
});

describe('GET /api/actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all actions mapped to Action type', async () => {
    const rows = [makeRow(), makeRow({ id: 'def-456', name: 'Second' })];
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: rows, error: null });

    const { GET } = await import('@/app/api/actions/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe('abc-123');
    expect(body[0].scriptContent).toBe('console.log("hi")');
    expect(body[1].name).toBe('Second');
  });

  it('returns empty array when no actions exist', async () => {
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: [], error: null });

    const { GET } = await import('@/app/api/actions/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB down' } });

    const { GET } = await import('@/app/api/actions/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Database error');
  });
});

describe('GET /api/actions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a single action by id', async () => {
    const row = makeRow();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: row, error: null });

    const { GET } = await import('@/app/api/actions/[id]/route');
    const request = new Request('http://localhost/api/actions/abc-123');
    const response = await GET(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe('abc-123');
    expect(body.schedule.days).toEqual([1, 3, 5]);
  });

  it('returns 404 when action not found', async () => {
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const { GET } = await import('@/app/api/actions/[id]/route');
    const request = new Request('http://localhost/api/actions/nonexistent');
    const response = await GET(request as any, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Action not found');
  });
});


describe('POST /api/actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCommitScript.mockResolvedValue(undefined);
    mockCommitWorkflow.mockResolvedValue(undefined);
  });

  const validBody = {
    name: 'My Action',
    scriptContent: 'console.log("hello")',
    schedule: {
      days: [1, 3, 5],
      hour: 9,
      minute: 30,
      period: 'AM' as const,
      timezone: 'America/New_York',
    },
  };

  function makePostRequest(body: unknown): Request {
    return new Request('http://localhost/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('creates an action and returns 201', async () => {
    const insertedRow = makeRow({
      id: 'test-uuid-1234',
      name: 'My Action',
      script_content: 'console.log("hello")',
      days: [1, 3, 5],
      time_hour: 9,
      time_minute: 30,
      time_period: 'AM',
      timezone: 'America/New_York',
    });

    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: insertedRow, error: null });

    const { POST } = await import('@/app/api/actions/route');
    const response = await POST(makePostRequest(validBody) as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe('test-uuid-1234');
    expect(body.name).toBe('My Action');
    expect(body.schedule.days).toEqual([1, 3, 5]);
    expect(mockCommitScript).toHaveBeenCalledWith(TEST_USER_ID, 'test-uuid-1234', 'console.log("hello")');
    expect(mockCommitWorkflow).toHaveBeenCalledWith(TEST_USER_ID, 'test-uuid-1234', 'name: mock-workflow\n');
  });

  it('returns 400 when name is missing', async () => {
    const { POST } = await import('@/app/api/actions/route');
    const response = await POST(makePostRequest({ ...validBody, name: '' }) as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.fields).toContain('name is required');
  });

  it('returns 400 when scriptContent is missing', async () => {
    const { POST } = await import('@/app/api/actions/route');
    const response = await POST(makePostRequest({ ...validBody, scriptContent: '' }) as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.fields).toContain('scriptContent is required');
  });

  it('returns 400 when schedule is invalid', async () => {
    const { POST } = await import('@/app/api/actions/route');
    const response = await POST(
      makePostRequest({
        ...validBody,
        schedule: { days: [], hour: 9, minute: 30, period: 'AM', timezone: 'America/New_York' },
      }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 502 when GitHub commit fails and does not touch Supabase', async () => {
    mockCommitScript.mockRejectedValue(new Error('GitHub API error'));

    const { POST } = await import('@/app/api/actions/route');
    const response = await POST(makePostRequest(validBody) as any);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe('GitHub operation failed');
    expect(body.details).toContain('GitHub API error');
    // Supabase should NOT have been called
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns 500 when Supabase insert fails (after GitHub success)', async () => {
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const { POST } = await import('@/app/api/actions/route');
    const response = await POST(makePostRequest(validBody) as any);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Database error');
  });

  it('returns 400 when schedule is missing entirely', async () => {
    const { POST } = await import('@/app/api/actions/route');
    const response = await POST(
      makePostRequest({ name: 'Test', scriptContent: 'code' }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.fields).toContain('schedule is required');
  });
});


describe('PUT /api/actions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCommitScript.mockResolvedValue(undefined);
    mockCommitWorkflow.mockResolvedValue(undefined);
  });

  const validBody = {
    name: 'Updated Action',
    scriptContent: 'console.log("updated")',
    schedule: {
      days: [0, 2, 4],
      hour: 3,
      minute: 15,
      period: 'PM' as const,
      timezone: 'Europe/London',
    },
  };

  function makePutRequest(body: unknown): Request {
    return new Request('http://localhost/api/actions/abc-123', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  function mockFetchExisting(row: ReturnType<typeof makeRow> | null, error: unknown = null) {
    const singleFn = vi.fn().mockResolvedValue({ data: row, error });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValueOnce({ select: selectFn });
    return { selectFn, eqFn, singleFn };
  }

  function mockUpdateRow(row: ReturnType<typeof makeRow> | null, error: unknown = null) {
    const singleFn = vi.fn().mockResolvedValue({ data: row, error });
    const selectFn = vi.fn().mockReturnValue({ single: singleFn });
    const eqFn = vi.fn().mockReturnValue({ select: selectFn });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValueOnce({ update: updateFn });
    return { updateFn, eqFn, selectFn, singleFn };
  }

  it('updates an action and returns the updated data', async () => {
    const existingRow = makeRow();
    const updatedRow = makeRow({
      name: 'Updated Action',
      script_content: 'console.log("updated")',
      days: [0, 2, 4],
      time_hour: 3,
      time_minute: 15,
      time_period: 'PM',
      timezone: 'Europe/London',
      updated_at: '2024-06-01T00:00:00Z',
    });

    mockFetchExisting(existingRow);
    mockUpdateRow(updatedRow);

    const { PUT } = await import('@/app/api/actions/[id]/route');
    const response = await PUT(makePutRequest(validBody) as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe('Updated Action');
    expect(body.schedule.days).toEqual([0, 2, 4]);
    expect(body.schedule.timezone).toBe('Europe/London');
    expect(mockCommitScript).toHaveBeenCalledWith(TEST_USER_ID, 'abc-123', 'console.log("updated")');
    expect(mockCommitWorkflow).toHaveBeenCalledWith(TEST_USER_ID, 'abc-123', 'name: mock-workflow\n');
  });

  it('returns 404 when action does not exist', async () => {
    mockFetchExisting(null, { message: 'Not found' });

    const { PUT } = await import('@/app/api/actions/[id]/route');
    const response = await PUT(makePutRequest(validBody) as any, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Action not found');
    expect(mockCommitScript).not.toHaveBeenCalled();
  });

  it('returns 400 when name is missing', async () => {
    const { PUT } = await import('@/app/api/actions/[id]/route');
    const response = await PUT(makePutRequest({ ...validBody, name: '' }) as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.fields).toContain('name is required');
  });

  it('returns 400 when scriptContent is missing', async () => {
    const { PUT } = await import('@/app/api/actions/[id]/route');
    const response = await PUT(makePutRequest({ ...validBody, scriptContent: '' }) as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.fields).toContain('scriptContent is required');
  });

  it('returns 400 when schedule is invalid', async () => {
    const { PUT } = await import('@/app/api/actions/[id]/route');
    const response = await PUT(
      makePutRequest({
        ...validBody,
        schedule: { days: [], hour: 9, minute: 30, period: 'AM', timezone: 'America/New_York' },
      }) as any,
      { params: Promise.resolve({ id: 'abc-123' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 502 when GitHub commit fails and does not update Supabase', async () => {
    const existingRow = makeRow();
    mockFetchExisting(existingRow);
    mockCommitScript.mockRejectedValue(new Error('GitHub API error'));

    const { PUT } = await import('@/app/api/actions/[id]/route');
    const response = await PUT(makePutRequest(validBody) as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe('GitHub operation failed');
    expect(body.details).toContain('GitHub API error');
    // mockFrom was called once for the fetch, but should NOT be called again for update
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when Supabase update fails after GitHub success', async () => {
    const existingRow = makeRow();
    mockFetchExisting(existingRow);
    mockUpdateRow(null, { message: 'DB error' });

    const { PUT } = await import('@/app/api/actions/[id]/route');
    const response = await PUT(makePutRequest(validBody) as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Database error');
  });
});


describe('DELETE /api/actions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteScript.mockResolvedValue(undefined);
    mockDeleteWorkflow.mockResolvedValue(undefined);
  });

  function mockFetchExisting(row: ReturnType<typeof makeRow> | null, error: unknown = null) {
    const singleFn = vi.fn().mockResolvedValue({ data: row, error });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValueOnce({ select: selectFn });
    return { selectFn, eqFn, singleFn };
  }

  function mockDeleteRow(error: unknown = null) {
    const eqFn = vi.fn().mockResolvedValue({ error });
    const deleteFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValueOnce({ delete: deleteFn });
    return { deleteFn, eqFn };
  }

  it('deletes an action and returns 200 with success message', async () => {
    const existingRow = makeRow();
    mockFetchExisting(existingRow);
    mockDeleteRow();

    const { DELETE } = await import('@/app/api/actions/[id]/route');
    const request = new Request('http://localhost/api/actions/abc-123', { method: 'DELETE' });
    const response = await DELETE(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Action deleted successfully');
    expect(mockDeleteScript).toHaveBeenCalledWith(TEST_USER_ID, 'abc-123');
    expect(mockDeleteWorkflow).toHaveBeenCalledWith(TEST_USER_ID, 'abc-123');
  });

  it('returns 404 when action does not exist', async () => {
    mockFetchExisting(null, { message: 'Not found' });

    const { DELETE } = await import('@/app/api/actions/[id]/route');
    const request = new Request('http://localhost/api/actions/nonexistent', { method: 'DELETE' });
    const response = await DELETE(request as any, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Action not found');
    expect(mockDeleteScript).not.toHaveBeenCalled();
    expect(mockDeleteWorkflow).not.toHaveBeenCalled();
  });

  it('returns 502 when GitHub delete fails and does not delete from Supabase', async () => {
    const existingRow = makeRow();
    mockFetchExisting(existingRow);
    mockDeleteScript.mockRejectedValue(new Error('GitHub API error'));

    const { DELETE } = await import('@/app/api/actions/[id]/route');
    const request = new Request('http://localhost/api/actions/abc-123', { method: 'DELETE' });
    const response = await DELETE(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe('GitHub operation failed');
    expect(body.details).toContain('GitHub API error');
    // mockFrom was called once for the fetch, but should NOT be called again for delete
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when Supabase delete fails after GitHub success', async () => {
    const existingRow = makeRow();
    mockFetchExisting(existingRow);
    mockDeleteRow({ message: 'DB error' });

    const { DELETE } = await import('@/app/api/actions/[id]/route');
    const request = new Request('http://localhost/api/actions/abc-123', { method: 'DELETE' });
    const response = await DELETE(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Database error');
  });

  it('calls deleteScript before deleteWorkflow', async () => {
    const callOrder: string[] = [];
    mockDeleteScript.mockImplementation(async () => { callOrder.push('deleteScript'); });
    mockDeleteWorkflow.mockImplementation(async () => { callOrder.push('deleteWorkflow'); });

    const existingRow = makeRow();
    mockFetchExisting(existingRow);
    mockDeleteRow();

    const { DELETE } = await import('@/app/api/actions/[id]/route');
    const request = new Request('http://localhost/api/actions/abc-123', { method: 'DELETE' });
    await DELETE(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });

    expect(callOrder).toEqual(['deleteScript', 'deleteWorkflow']);
  });
});


describe('POST /api/actions/[id]/toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnableWorkflow.mockResolvedValue(undefined);
    mockDisableWorkflow.mockResolvedValue(undefined);
  });

  function mockFetchExisting(row: ReturnType<typeof makeRow> | null, error: unknown = null) {
    const singleFn = vi.fn().mockResolvedValue({ data: row, error });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValueOnce({ select: selectFn });
    return { selectFn, eqFn, singleFn };
  }

  function mockUpdateRow(row: ReturnType<typeof makeRow> | null, error: unknown = null) {
    const singleFn = vi.fn().mockResolvedValue({ data: row, error });
    const selectFn = vi.fn().mockReturnValue({ single: singleFn });
    const eqFn = vi.fn().mockReturnValue({ select: selectFn });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValueOnce({ update: updateFn });
    return { updateFn, eqFn, selectFn, singleFn };
  }

  it('pauses an active action', async () => {
    const existingRow = makeRow({ status: 'active' });
    const updatedRow = makeRow({ status: 'paused' });
    mockFetchExisting(existingRow);
    mockUpdateRow(updatedRow);

    const { POST } = await import('@/app/api/actions/[id]/toggle/route');
    const request = new Request('http://localhost/api/actions/abc-123/toggle', { method: 'POST' });
    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('paused');
    expect(mockDisableWorkflow).toHaveBeenCalledWith(TEST_USER_ID, 'abc-123');
    expect(mockEnableWorkflow).not.toHaveBeenCalled();
  });

  it('resumes a paused action', async () => {
    const existingRow = makeRow({ status: 'paused' });
    const updatedRow = makeRow({ status: 'active' });
    mockFetchExisting(existingRow);
    mockUpdateRow(updatedRow);

    const { POST } = await import('@/app/api/actions/[id]/toggle/route');
    const request = new Request('http://localhost/api/actions/abc-123/toggle', { method: 'POST' });
    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('active');
    expect(mockEnableWorkflow).toHaveBeenCalledWith(TEST_USER_ID, 'abc-123');
    expect(mockDisableWorkflow).not.toHaveBeenCalled();
  });

  it('returns 404 when action not found', async () => {
    mockFetchExisting(null, { message: 'Not found' });

    const { POST } = await import('@/app/api/actions/[id]/toggle/route');
    const request = new Request('http://localhost/api/actions/nonexistent/toggle', { method: 'POST' });
    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Action not found');
    expect(mockDisableWorkflow).not.toHaveBeenCalled();
    expect(mockEnableWorkflow).not.toHaveBeenCalled();
  });

  it('returns 502 when GitHub fails and does not update Supabase', async () => {
    const existingRow = makeRow({ status: 'active' });
    mockFetchExisting(existingRow);
    mockDisableWorkflow.mockRejectedValue(new Error('GitHub API error'));

    const { POST } = await import('@/app/api/actions/[id]/toggle/route');
    const request = new Request('http://localhost/api/actions/abc-123/toggle', { method: 'POST' });
    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe('GitHub operation failed');
    // mockFrom called once for fetch, should NOT be called again for update
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when Supabase update fails after GitHub success', async () => {
    const existingRow = makeRow({ status: 'active' });
    mockFetchExisting(existingRow);
    mockUpdateRow(null, { message: 'DB error' });

    const { POST } = await import('@/app/api/actions/[id]/toggle/route');
    const request = new Request('http://localhost/api/actions/abc-123/toggle', { method: 'POST' });
    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Database error');
  });
});


describe('POST /api/actions/[id]/trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTriggerWorkflow.mockResolvedValue(undefined);
  });

  function mockFetchExisting(row: { id: string; status?: string; user_id?: string } | null, error: unknown = null) {
    const singleFn = vi.fn().mockResolvedValue({ data: row, error });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValueOnce({ select: selectFn });
  }

  it('triggers a workflow and returns success', async () => {
    mockFetchExisting({ id: 'abc-123', status: 'active', user_id: TEST_USER_ID });

    const { POST } = await import('@/app/api/actions/[id]/trigger/route');
    const request = new Request('http://localhost/api/actions/abc-123/trigger', { method: 'POST' });
    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Workflow triggered successfully');
    expect(mockTriggerWorkflow).toHaveBeenCalledWith(TEST_USER_ID, 'abc-123');
  });

  it('returns 409 when action is paused', async () => {
    mockFetchExisting({ id: 'abc-123', status: 'paused', user_id: TEST_USER_ID });

    const { POST } = await import('@/app/api/actions/[id]/trigger/route');
    const request = new Request('http://localhost/api/actions/abc-123/trigger', { method: 'POST' });
    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Action is paused');
    expect(mockTriggerWorkflow).not.toHaveBeenCalled();
  });

  it('returns 404 when action not found', async () => {
    mockFetchExisting(null, { message: 'Not found' });

    const { POST } = await import('@/app/api/actions/[id]/trigger/route');
    const request = new Request('http://localhost/api/actions/nonexistent/trigger', { method: 'POST' });
    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Action not found');
    expect(mockTriggerWorkflow).not.toHaveBeenCalled();
  });

  it('returns 502 when GitHub trigger fails', async () => {
    mockFetchExisting({ id: 'abc-123', status: 'active', user_id: TEST_USER_ID });
    mockTriggerWorkflow.mockRejectedValue(new Error('GitHub dispatch error'));

    const { POST } = await import('@/app/api/actions/[id]/trigger/route');
    const request = new Request('http://localhost/api/actions/abc-123/trigger', { method: 'POST' });
    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe('GitHub operation failed');
    expect(body.details).toContain('GitHub dispatch error');
  });
});


describe('GET /api/actions/[id]/runs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockFetchExisting(row: { id: string; user_id?: string } | null, error: unknown = null) {
    const singleFn = vi.fn().mockResolvedValue({ data: row, error });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValueOnce({ select: selectFn });
  }

  const sampleRuns = [
    { id: 1, status: 'success' as const, timestamp: '2024-01-01T00:00:00Z', output: 'OK', trigger: 'schedule' as const },
    { id: 2, status: 'failure' as const, timestamp: '2024-01-02T00:00:00Z', output: 'Error', trigger: 'workflow_dispatch' as const },
  ];

  it('returns run history for an action', async () => {
    mockFetchExisting({ id: 'abc-123', user_id: TEST_USER_ID });
    mockGetWorkflowRuns.mockResolvedValue(sampleRuns);

    const { GET } = await import('@/app/api/actions/[id]/runs/route');
    const request = new Request('http://localhost/api/actions/abc-123/runs');
    const response = await GET(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].status).toBe('success');
    expect(mockGetWorkflowRuns).toHaveBeenCalledWith(TEST_USER_ID, 'abc-123', 1, undefined);
  });

  it('passes page and status query params', async () => {
    mockFetchExisting({ id: 'abc-123', user_id: TEST_USER_ID });
    mockGetWorkflowRuns.mockResolvedValue(sampleRuns);

    const { GET } = await import('@/app/api/actions/[id]/runs/route');
    const request = new Request('http://localhost/api/actions/abc-123/runs?page=3&status=success');
    const response = await GET(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });

    expect(response.status).toBe(200);
    expect(mockGetWorkflowRuns).toHaveBeenCalledWith(TEST_USER_ID, 'abc-123', 3, 'success');
  });

  it('defaults page to 1 for invalid values', async () => {
    mockFetchExisting({ id: 'abc-123', user_id: TEST_USER_ID });
    mockGetWorkflowRuns.mockResolvedValue([]);

    const { GET } = await import('@/app/api/actions/[id]/runs/route');
    const request = new Request('http://localhost/api/actions/abc-123/runs?page=abc');
    const response = await GET(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });

    expect(response.status).toBe(200);
    expect(mockGetWorkflowRuns).toHaveBeenCalledWith(TEST_USER_ID, 'abc-123', 1, undefined);
  });

  it('caps results at 100 entries', async () => {
    mockFetchExisting({ id: 'abc-123', user_id: TEST_USER_ID });
    const manyRuns = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      status: 'success' as const,
      timestamp: '2024-01-01T00:00:00Z',
      output: `Run ${i}`,
      trigger: 'schedule' as const,
    }));
    mockGetWorkflowRuns.mockResolvedValue(manyRuns);

    const { GET } = await import('@/app/api/actions/[id]/runs/route');
    const request = new Request('http://localhost/api/actions/abc-123/runs');
    const response = await GET(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(100);
  });

  it('returns 404 when action not found', async () => {
    mockFetchExisting(null, { message: 'Not found' });

    const { GET } = await import('@/app/api/actions/[id]/runs/route');
    const request = new Request('http://localhost/api/actions/nonexistent/runs');
    const response = await GET(request as any, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Action not found');
    expect(mockGetWorkflowRuns).not.toHaveBeenCalled();
  });

  it('returns 502 when GitHub API fails', async () => {
    mockFetchExisting({ id: 'abc-123', user_id: TEST_USER_ID });
    mockGetWorkflowRuns.mockRejectedValue(new Error('GitHub runs error'));

    const { GET } = await import('@/app/api/actions/[id]/runs/route');
    const request = new Request('http://localhost/api/actions/abc-123/runs');
    const response = await GET(request as any, {
      params: Promise.resolve({ id: 'abc-123' }),
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe('GitHub operation failed');
    expect(body.details).toContain('GitHub runs error');
  });
});
