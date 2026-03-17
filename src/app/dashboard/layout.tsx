import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side auth guard for all /dashboard routes.
 * Reads the access token from cookies, verifies it with Supabase.
 * If the token is expired but a refresh token exists, refreshes inline.
 * Redirects to /login only when there's truly no valid session.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("sb-access-token")?.value ??
    cookieStore.get(
      `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`
    )?.value;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;

  // No tokens at all — definitely not logged in
  if (!accessToken && !refreshToken) {
    redirect("/login");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Try the current access token first
  if (accessToken) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return <>{children}</>;
    }
  }

  // Access token missing or expired — try refreshing
  if (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (!error && data.session && data.user) {
      // Refresh succeeded — the proxy will set the new cookies on the
      // response, but we can proceed rendering since we have a valid user.
      return <>{children}</>;
    }
  }

  // Both tokens failed
  redirect("/login");
}
