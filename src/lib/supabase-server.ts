import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { getEnvConfig } from './env';

export interface AuthenticatedClient {
  supabase: SupabaseClient;
  userId: string;
}

let serverClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client configured with the service role key
 * for full DB access on the server side. Reuses a singleton instance.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClient) {
    const config = getEnvConfig();
    serverClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serverClient;
}

/**
 * Resets the singleton (useful for testing).
 */
export function resetSupabaseServerClient(): void {
  serverClient = null;
}

/**
 * Creates a Supabase client authenticated as the requesting user.
 * Reads the access token from cookies, validates it, and returns
 * both the client (with RLS enforced) and the user's ID.
 *
 * If the access token is expired but a valid refresh token exists,
 * attempts to refresh the session automatically.
 *
 * @throws Error if authentication fails (caller should return 401)
 */
export async function getAuthenticatedClient(
  cookieStore: ReadonlyRequestCookies
): Promise<AuthenticatedClient> {
  const config = getEnvConfig();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  if (!accessToken && !refreshToken) {
    throw new Error('Authentication required');
  }

  const supabase = createClient(config.SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Try the access token first
  if (accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      return { supabase, userId: user.id };
    }
  }

  // Access token missing or expired — attempt refresh
  if (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (!error && data.session && data.user) {
      return { supabase, userId: data.user.id };
    }
  }

  throw new Error('Authentication required');
}
