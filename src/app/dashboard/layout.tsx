import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side auth guard for all /dashboard routes.
 * Verifies the Supabase session token from cookies.
 * Redirects to /login if unauthenticated.
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

  if (!accessToken) {
    redirect("/login");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return <>{children}</>;
}
