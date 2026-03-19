"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface AdminStats {
  totalUsers: number;
  totalActions: number;
  totalRuns: number;
  planBreakdown: { planName: string; count: number }[];
  recentUsers: { id: string; email: string; createdAt: string; planName: string }[];
  systemHealth: { github: boolean; cronjob: boolean; supabase: boolean; email: boolean };
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (!res.ok) { setError("Failed to load admin data"); return; }
      const data: AdminStats = await res.json();
      setStats(data);
      setError("");
    } catch { setError("Failed to load admin data"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2"><Logo showWordmark /></Link>
            <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-200">Admin</span>
          </div>
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">← Dashboard</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-8 text-2xl font-bold text-slate-900">System Overview</h1>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100 mb-3" />
                <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</div>
        ) : stats ? (
          <>
            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard label="Total Users" value={stats.totalUsers} />
              <StatCard label="Total Jobs" value={stats.totalActions} />
              <StatCard label="Total Runs" value={stats.totalRuns} />
              <StatCard label="Plans Active" value={stats.planBreakdown.length} />
            </div>

            {/* System health */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900">System Health</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <HealthIndicator name="Supabase" healthy={stats.systemHealth.supabase} />
                <HealthIndicator name="GitHub" healthy={stats.systemHealth.github} />
                <HealthIndicator name="Cron-job.org" healthy={stats.systemHealth.cronjob} />
                <HealthIndicator name="Email (Resend)" healthy={stats.systemHealth.email} />
              </div>
            </div>

            {/* Plan breakdown */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Plan Distribution</h2>
              <div className="space-y-3">
                {stats.planBreakdown.map(p => (
                  <div key={p.planName} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{p.planName}</span>
                    <span className="text-sm font-semibold text-slate-900">{p.count} users</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent users */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Recent Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Email</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Plan</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.recentUsers.map(u => (
                      <tr key={u.id}>
                        <td className="py-3 text-slate-700">{u.email}</td>
                        <td className="py-3"><span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600">{u.planName}</span></td>
                        <td className="py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function HealthIndicator({ name, healthy }: { name: string; healthy: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
      <span className={`h-2.5 w-2.5 rounded-full ${healthy ? "bg-emerald-500" : "bg-red-500"}`} />
      <span className="text-sm text-slate-700">{name}</span>
      <span className={`ml-auto text-xs font-medium ${healthy ? "text-emerald-600" : "text-red-600"}`}>
        {healthy ? "Healthy" : "Down"}
      </span>
    </div>
  );
}
