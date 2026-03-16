import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnvConfig } from './env';

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
