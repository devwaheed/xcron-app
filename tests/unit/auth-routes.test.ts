import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase-server before importing routes
const mockSignInWithPassword = vi.fn();
const mockResetPasswordForEmail = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  })),
}));

// We need to mock NextRequest/NextResponse for route handler testing
function createRequest(body: unknown): Request {
  return new Request('http://localhost:3000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `test-${Math.random().toString(36).slice(2)}`,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    mockSignInWithPassword.mockReset();
    mockResetPasswordForEmail.mockReset();

    const mod = await import('@/app/api/auth/login/route');
    POST = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when email is missing', async () => {
    const req = createRequest({ password: 'pass123' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Email and password are required');
  });

  it('returns 400 when password is missing', async () => {
    const req = createRequest({ email: 'admin@test.com' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Email and password are required');
  });

  it('returns 401 when Supabase auth fails', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid credentials' },
    });

    const req = createRequest({ email: 'admin@test.com', password: 'wrong' });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Authentication failed');
  });

  it('returns 200 and sets cookie on successful login', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-access-token',
          expires_in: 3600,
        },
      },
      error: null,
    });

    const req = createRequest({ email: 'admin@test.com', password: 'correct' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    // Check that the Set-Cookie header is present
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('sb-access-token=test-access-token');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/');
  });

  it('calls signInWithPassword with correct credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: { access_token: 'tok', expires_in: 3600 },
      },
      error: null,
    });

    const req = createRequest({ email: 'admin@test.com', password: 'secret' });
    await POST(req);

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'admin@test.com',
      password: 'secret',
    });
  });
});

describe('POST /api/auth/logout', () => {
  let POST: () => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/app/api/auth/logout/route');
    POST = mod.POST as unknown as () => Promise<Response>;
  });

  it('returns 200 and clears the auth cookie', async () => {
    const res = await POST();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('sb-access-token=');
    expect(setCookie).toContain('Max-Age=0');
  });
});

describe('POST /api/auth/reset-password', () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    mockResetPasswordForEmail.mockReset();
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const mod = await import('@/app/api/auth/reset-password/route');
    POST = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it('returns 400 when email is missing', async () => {
    const req = createRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Email is required');
  });

  it('returns success for a valid email', async () => {
    const req = createRequest({ email: 'admin@test.com' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('calls resetPasswordForEmail with the provided email', async () => {
    const req = createRequest({ email: 'admin@test.com' });
    await POST(req);
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('admin@test.com');
  });

  it('returns success even when Supabase returns an error (no email leak)', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      data: null,
      error: { message: 'User not found' },
    });

    const req = createRequest({ email: 'nonexistent@test.com' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
