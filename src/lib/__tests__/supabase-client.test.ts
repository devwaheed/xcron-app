import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSupabaseBrowserClient, resetSupabaseBrowserClient } from '../supabase-client';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getSession: vi.fn() } })),
}));

import { createClient } from '@supabase/supabase-js';

describe('getSupabaseBrowserClient', () => {
  beforeEach(() => {
    resetSupabaseBrowserClient();
    vi.mocked(createClient).mockClear();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates a client with the anon key', () => {
    getSupabaseBrowserClient();

    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key'
    );
  });

  it('returns the same singleton on subsequent calls', () => {
    const first = getSupabaseBrowserClient();
    const second = getSupabaseBrowserClient();

    expect(first).toBe(second);
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it('creates a new client after reset', () => {
    getSupabaseBrowserClient();
    resetSupabaseBrowserClient();
    getSupabaseBrowserClient();

    expect(createClient).toHaveBeenCalledTimes(2);
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');

    expect(() => getSupabaseBrowserClient()).toThrow(
      'Missing required environment variables'
    );
  });

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    expect(() => getSupabaseBrowserClient()).toThrow(
      'Missing required environment variables'
    );
  });
});
