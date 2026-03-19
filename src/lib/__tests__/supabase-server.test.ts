import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSupabaseServerClient, resetSupabaseServerClient, getAuthenticatedClient } from '../supabase-server';

const mockGetUser = vi.fn();
const mockRefreshSession = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: {
      getUser: mockGetUser,
      refreshSession: mockRefreshSession,
    },
  })),
}));

import { createClient } from '@supabase/supabase-js';

const fullEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  GITHUB_REPO_OWNER: 'owner',
  GITHUB_REPO_NAME: 'repo',
  GITHUB_PAT: 'ghp_token',
  CRONJOB_API_KEY: 'test-cronjob-api-key',
  CRON_SECRET: 'test-cron-secret',
  NEXT_PUBLIC_APP_URL: 'https://example.com',
};

function makeCookieStore(cookies: Record<string, string>) {
  return {
    get: (name: string) => {
      const value = cookies[name];
      return value !== undefined ? { name, value } : undefined;
    },
  } as any;
}

describe('getSupabaseServerClient', () => {
  beforeEach(() => {
    resetSupabaseServerClient();
    vi.mocked(createClient).mockClear();
    for (const [key, value] of Object.entries(fullEnv)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates a client with the service role key and correct options', () => {
    getSupabaseServerClient();

    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  });

  it('returns the same singleton on subsequent calls', () => {
    const first = getSupabaseServerClient();
    const second = getSupabaseServerClient();

    expect(first).toBe(second);
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it('creates a new client after reset', () => {
    getSupabaseServerClient();
    resetSupabaseServerClient();
    getSupabaseServerClient();

    expect(createClient).toHaveBeenCalledTimes(2);
  });
});

describe('getAuthenticatedClient', () => {
  beforeEach(() => {
    resetSupabaseServerClient();
    vi.mocked(createClient).mockClear();
    mockGetUser.mockReset();
    mockRefreshSession.mockReset();
    for (const [key, value] of Object.entries(fullEnv)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns supabase client and userId when access token is valid', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const cookieStore = makeCookieStore({ 'sb-access-token': 'valid-token' });
    const result = await getAuthenticatedClient(cookieStore);

    expect(result.userId).toBe('user-123');
    expect(result.supabase).toBeDefined();
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({
        global: { headers: { Authorization: 'Bearer valid-token' } },
      })
    );
  });

  it('refreshes session when access token is expired but refresh token exists', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Token expired' },
    });
    mockRefreshSession.mockResolvedValue({
      data: {
        session: { access_token: 'new-token' },
        user: { id: 'user-456' },
      },
      error: null,
    });

    const cookieStore = makeCookieStore({
      'sb-access-token': 'expired-token',
      'sb-refresh-token': 'valid-refresh',
    });
    const result = await getAuthenticatedClient(cookieStore);

    expect(result.userId).toBe('user-456');
    expect(mockRefreshSession).toHaveBeenCalledWith({ refresh_token: 'valid-refresh' });
  });

  it('refreshes session when only refresh token exists (no access token)', async () => {
    mockRefreshSession.mockResolvedValue({
      data: {
        session: { access_token: 'new-token' },
        user: { id: 'user-789' },
      },
      error: null,
    });

    const cookieStore = makeCookieStore({ 'sb-refresh-token': 'valid-refresh' });
    const result = await getAuthenticatedClient(cookieStore);

    expect(result.userId).toBe('user-789');
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('throws when no cookies are present', async () => {
    const cookieStore = makeCookieStore({});
    await expect(getAuthenticatedClient(cookieStore)).rejects.toThrow('Authentication required');
  });

  it('throws when access token is invalid and no refresh token exists', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const cookieStore = makeCookieStore({ 'sb-access-token': 'bad-token' });
    await expect(getAuthenticatedClient(cookieStore)).rejects.toThrow('Authentication required');
  });

  it('throws when both access token and refresh token fail', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Token expired' },
    });
    mockRefreshSession.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Refresh failed' },
    });

    const cookieStore = makeCookieStore({
      'sb-access-token': 'expired-token',
      'sb-refresh-token': 'expired-refresh',
    });
    await expect(getAuthenticatedClient(cookieStore)).rejects.toThrow('Authentication required');
  });
});
