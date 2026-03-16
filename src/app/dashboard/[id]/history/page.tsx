"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { RunEntry } from "@/types";
import RunHistoryEntry from "@/components/RunHistoryEntry";

type StatusFilter = "all" | "success" | "failure";

export default function RunHistoryPage() {
  const params = useParams<{ id: string }>();
  const actionId = params.id;

  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hasMore, setHasMore] = useState(false);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") query.set("status", statusFilter);
      const res = await fetch(`/api/actions/${actionId}/runs?${query}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to load runs" }));
        setError(data.error || "Failed to load runs");
        setRuns([]); setHasMore(false); return;
      }
      const data: RunEntry[] = await res.json();
      setRuns(data);
      setHasMore(data.length >= 30);
    } catch { setError("Failed to load runs"); setRuns([]); setHasMore(false); }
    finally { setLoading(false); }
  }, [actionId, page, statusFilter]);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  function handleFilterChange(filter: StatusFilter) {
    setStatusFilter(filter);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-100/60 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-100/50 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">Run History</h1>
          </div>
          <Link href="/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Filter pills */}
        <div className="mb-6 flex items-center gap-3">
          {(["all", "success", "failure"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                statusFilter === filter
                  ? "bg-violet-50 text-violet-600 ring-1 ring-violet-200"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50/80 px-5 py-3.5 text-sm text-red-600 backdrop-blur-xl">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              <p className="text-sm text-slate-400">Loading run history…</p>
            </div>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-12 backdrop-blur-xl">
              <p className="mb-2 text-lg font-semibold text-slate-900">No runs found</p>
              <p className="text-sm text-slate-400">
                {statusFilter !== "all"
                  ? "No runs match the selected filter. Try changing the filter."
                  : "This action hasn't been executed yet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {runs.map((run) => (
              <RunHistoryEntry key={run.id} run={run} />
            ))}
          </div>
        )}

        {!loading && (runs.length > 0 || page > 1) && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40">
              Previous
            </button>
            <span className="text-sm text-slate-400">Page {page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
