import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getEnvConfig } from '../env';

const fullEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  GITHUB_REPO_OWNER: 'owner',
  GITHUB_REPO_NAME: 'repo',
  GITHUB_PAT: 'ghp_token',
};

describe('getEnvConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    vi.stubEnv('GITHUB_REPO_OWNER', '');
    vi.stubEnv('GITHUB_REPO_NAME', '');
    vi.stubEnv('GITHUB_PAT', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns all env vars when fully configured', () => {
    for (const [key, value] of Object.entries(fullEnv)) {
      vi.stubEnv(key, value);
    }

    const config = getEnvConfig();
    expect(config).toEqual(fullEnv);
  });

  it('throws when a required variable is missing', () => {
    // Set all except GITHUB_PAT
    for (const [key, value] of Object.entries(fullEnv)) {
      if (key !== 'GITHUB_PAT') {
        vi.stubEnv(key, value);
      }
    }

    expect(() => getEnvConfig()).toThrow('Missing required environment variables: GITHUB_PAT');
  });

  it('lists all missing variables in the error message', () => {
    // All env vars are empty strings from beforeEach
    expect(() => getEnvConfig()).toThrow('Missing required environment variables:');
    try {
      getEnvConfig();
    } catch (e: unknown) {
      const msg = (e as Error).message;
      expect(msg).toContain('SUPABASE_URL');
      expect(msg).toContain('GITHUB_PAT');
    }
  });
});
