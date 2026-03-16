// Feature: cron-job-builder, Property 1: Unauthenticated route protection

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Validates: Requirements 2.7
 *
 * For any protected route (dashboard and sub-routes) and any unauthenticated
 * request (no auth cookies), the auth guard should redirect to /login.
 *
 * Since auth is now handled in dashboard/layout.tsx (Server Layout Guard),
 * we test the auth verification logic: for any missing or invalid token,
 * the Supabase getUser call returns no user, triggering a redirect.
 */

// Mock next/navigation redirect
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error('NEXT_REDIRECT');
  },
}));

// Mock next/headers cookies
const mockCookieStore = new Map<string, { value: string }>();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => mockCookieStore.get(name) ?? undefined,
  })),
}));

// Mock Supabase to always return no user (unauthenticated)
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'No session' },
      }),
    },
  })),
}));

/**
 * Arbitrary generator for cookie scenarios that should all be unauthenticated.
 */
const arbitraryCookieScenario = fc.oneof(
  // No cookies at all
  fc.constant(new Map<string, { value: string }>()),
  // Random cookie name that isn't the auth token
  fc.string({ minLength: 1, maxLength: 20 }).map(
    (name) => new Map([[name, { value: 'some-value' }]])
  ),
  // Has the right cookie name but Supabase rejects the token
  fc.constant(new Map([['sb-access-token', { value: 'invalid-token' }]]))
);

describe('Property 1: Unauthenticated route protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.clear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('redirects to /login for any unauthenticated cookie scenario', async () => {
    // Dynamic import so mocks are applied
    const layoutModule = await import('@/app/dashboard/layout');
    const DashboardLayout = layoutModule.default;

    await fc.assert(
      fc.asyncProperty(arbitraryCookieScenario, async (cookies) => {
        mockRedirect.mockClear();
        mockCookieStore.clear();
        for (const [key, val] of cookies) {
          mockCookieStore.set(key, val);
        }

        try {
          await DashboardLayout({ children: null });
        } catch (e) {
          // redirect() throws NEXT_REDIRECT — that's expected
          if (e instanceof Error && e.message === 'NEXT_REDIRECT') {
            expect(mockRedirect).toHaveBeenCalledWith('/login');
            return;
          }
          throw e;
        }

        // If no error was thrown, redirect should still have been called
        // (for the case where cookies are empty and we redirect before Supabase call)
        expect(mockRedirect).toHaveBeenCalledWith('/login');
      }),
      { numRuns: 50 },
    );
  });
});
