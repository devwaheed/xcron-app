import { createClient, SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client configured with the anon key for
 * client-side auth session management. Reuses a singleton instance.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error(
        'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
    }

    browserClient = createClient(url, anonKey);
  }
  return browserClient;
}

/**
 * Resets the singleton (useful for testing).
 */
export function resetSupabaseBrowserClient(): void {
  browserClient = null;
}
