import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Next.js proxy — handles session refresh before requests hit server components.
 *
 * When the access token is expired but a refresh token exists:
 * - Page routes: refresh + redirect so the browser retries with new cookies
 * - API routes: refresh + set cookies on the response directly
 *
 * A `_refreshed=1` param prevents infinite redirect loops on page routes.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle dashboard and actions API routes
  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/api/actions")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("sb-access-token")?.value;

  // Valid access token — pass through
  if (accessToken) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  // No refresh token either — nothing we can do
  if (!refreshToken) {
    return NextResponse.next();
  }

  // Async work needs to return a promise
  return handleRefresh(request, refreshToken);
}

async function handleRefresh(request: NextRequest, refreshToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let session;
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      return NextResponse.next();
    }
    session = data.session;
  } catch {
    return NextResponse.next();
  }

  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  if (isApiRoute) {
    const response = NextResponse.next();
    setCookies(response, session);
    return response;
  }

  // Page routes: already tried refreshing — don't loop
  if (request.nextUrl.searchParams.has("_refreshed")) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("_refreshed");
    return NextResponse.rewrite(clean);
  }

  // Redirect so the browser sends the new cookies on retry
  const url = request.nextUrl.clone();
  url.searchParams.set("_refreshed", "1");
  const response = NextResponse.redirect(url);
  setCookies(response, session);
  return response;
}

function setCookies(
  response: NextResponse,
  session: { access_token: string; refresh_token: string; expires_in: number }
) {
  response.cookies.set("sb-access-token", session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.expires_in,
  });
  response.cookies.set("sb-refresh-token", session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/actions/:path*"],
};
