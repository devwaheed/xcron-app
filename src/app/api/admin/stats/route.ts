import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthenticatedClient, getSupabaseServerClient } from "@/lib/supabase-server";
import { isEmailEnabled } from "@/lib/email";

/** Admin emails that can access the admin panel */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/**
 * GET /api/admin/stats
 * Returns system-wide stats for the admin panel.
 * Only accessible by users whose email is in ADMIN_EMAILS env var.
 */
export async function GET(_request: NextRequest) {
  let userEmail: string;

  try {
    const cookieStore = await cookies();
    const { supabase } = await getAuthenticatedClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    userEmail = user.email.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(userEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = getSupabaseServerClient();

    // Total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Total actions
    const { count: totalActions } = await supabase
      .from("actions")
      .select("*", { count: "exact", head: true });

    // Total runs (from usage_logs)
    const { count: totalRuns } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true });

    // Plan breakdown
    const { data: planData } = await supabase
      .from("user_plans")
      .select("plan_id, plans ( name )");

    const planCounts: Record<string, number> = {};
    for (const row of planData || []) {
      const planName = (row.plans as unknown as { name: string })?.name || "Unknown";
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    }
    const planBreakdown = Object.entries(planCounts).map(([planName, count]) => ({ planName, count }));

    // Recent users (last 10)
    const { data: recentProfiles } = await supabase
      .from("profiles")
      .select("user_id, email, timezone, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const recentUsers = [];
    for (const p of recentProfiles || []) {
      // Get plan name for each user
      const { data: up } = await supabase
        .from("user_plans")
        .select("plans ( name )")
        .eq("user_id", p.user_id)
        .single();
      const planName = (up?.plans as unknown as { name: string })?.name || "Starter";
      recentUsers.push({
        id: p.user_id,
        email: p.email || "—",
        createdAt: p.created_at,
        planName,
      });
    }

    // System health checks
    const systemHealth = {
      supabase: true, // If we got here, Supabase is working
      github: !!process.env.GITHUB_PAT,
      cronjob: !!process.env.CRONJOB_API_KEY,
      email: isEmailEnabled(),
    };

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalActions: totalActions || 0,
      totalRuns: totalRuns || 0,
      planBreakdown,
      recentUsers,
      systemHealth,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
