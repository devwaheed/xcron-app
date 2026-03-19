"use client";

import { useEffect, useState } from "react";
import type { UsageStats } from "@/types";

function ProgressBar({ used, limit, label, warning }: { used: number; limit: number; label: string; warning: boolean }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const barColor = warning ? "bg-amber-500" : "bg-violet-500";
  const textColor = warning ? "text-amber-600" : "text-slate-600";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium">
        <span className={textColor}>{label}</span>
        <span className={textColor}>{used} / {limit}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function UsageDisplay() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const data: UsageStats = await res.json();
          setStats(data);
        }
      } catch {
        // Silently fail — usage display is non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
          <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const actionWarning = stats.actions.limit > 0 && stats.actions.used >= stats.actions.limit * 0.8;
  const runWarning = stats.runs.limit > 0 && stats.runs.used >= stats.runs.limit * 0.8;

  const resetDate = new Date(stats.billingCycleReset);
  const daysLeft = Math.max(0, Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {stats.planName} Plan
        </span>
        <span className="text-xs text-slate-400">
          {daysLeft} day{daysLeft !== 1 ? "s" : ""} until reset
        </span>
      </div>
      <div className="space-y-3">
        <ProgressBar used={stats.actions.used} limit={stats.actions.limit} label="Jobs" warning={actionWarning} />
        <ProgressBar used={stats.runs.used} limit={stats.runs.limit} label="Runs this month" warning={runWarning} />
      </div>
    </div>
  );
}
