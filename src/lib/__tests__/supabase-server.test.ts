import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSupabaseServerClient, resetSupabaseServerClient } from '../supabase-server';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
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
