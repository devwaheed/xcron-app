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
      if (statusFilter !== "all") {
        query.set("status", statusFilter);
      }
      const res = await fetch(`/api/actions/${actionId}/runs?${query}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to load runs" }));
        setError(data.error || "Failed to load runs");
        setRuns([]);
        setHasMore(false);
        return;
      }
      const data: RunEntry[] = await res.json();
      setRuns(data);
      // If we got a full page of results, there might be more
      setHasMore(data.length >= 30);
    } catch {
      setError("Failed to load runs");
      setRuns([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [actionId, page, statusFilter]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  function handleFilterChange(filter: StatusFilter) {
    setStatusFilter(filter);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-white">Run History</h1>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Status filter */}
        <div className="mb-6 flex items-center gap-3">
          <label htmlFor="status-filter" className="text-sm font-medium text-white/70">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value as StatusFilter)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white backdrop-blur-xl focus:border-white/30 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-400">Loading run history…</p>
          </div>
        ) : runs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <p className="mb-2 text-lg font-semibold text-white">No runs found</p>
              <p className="text-sm text-slate-400">
                {statusFilter !== "all"
                  ? "No runs match the selected filter. Try changing the filter."
                  : "This action hasn't been executed yet."}
              </p>
            </div>
          </div>
        ) : (
          /* Run entries */
          <div className="flex flex-col gap-3">
            {runs.map((run) => (
              <RunHistoryEntry key={run.id} run={run} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && (runs.length > 0 || page > 1) && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
