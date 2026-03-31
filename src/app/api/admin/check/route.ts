import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthenticatedClient } from "@/lib/supabase-server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * GET /api/admin/check
 * Returns { isAdmin: true/false } for the current user.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const { supabase } = await getAuthenticatedClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ isAdmin: false });
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
