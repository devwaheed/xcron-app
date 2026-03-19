"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { RunEntry } from "@/types";
import EmptyState from "@/components/ui/EmptyState";
import { parseApiResponse, networkErrorMessage } from "@/lib/api-client";

type StatusFilter = "all" | "success" | "failure";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export default function RunHistoryPage() {
  const params = useParams<{ id: string }>();
  const actionId = params.id;

  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") query.set("status", statusFilter);
      const res = await fetch(`/api/actions/${actionId}/runs?${query}`);
      if (!res.ok) {
        const apiError = await parseApiResponse(res, "Failed to load runs");
        setError(apiError.message); setRuns([]); setHasMore(false); return;
      }
      const data: RunEntry[] = await res.json();
      setRuns(data);
      setHasMore(data.length >= 30);
    } catch { setError(networkErrorMessage("Failed to load runs")); setRuns([]); setHasMore(false); }
    finally { setLoading(false); }
  }, [actionId, page, statusFilter]);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  function handleFilterChange(filter: StatusFilter) {
    setStatusFilter(filter);
    setPage(1);
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <Link href="/dashboard" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">Run History</h1>
        </div>

        <div className="mb-6 flex items-center gap-3">
          {(["all", "success", "failure"] as const).map((filter) => (
            <button key={filter} onClick={() => handleFilterChange(filter)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                statusFilter === filter
                  ? "bg-violet-50 text-violet-600 ring-1 ring-violet-200"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              }`}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50/80 px-5 py-3.5 text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              <p className="text-sm text-slate-400">Loading run history…</p>
            </div>
          </div>
        ) : runs.length === 0 ? (
          <EmptyState illustration="no-runs" heading="No runs found"
            description={statusFilter !== "all" ? "No runs match the selected filter. Try changing the filter." : "This action hasn't been executed yet."} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/60">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Trigger</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((run) => {
                  const isSuccess = run.status === "success";
                  const isExpanded = expandedId === run.id;
                  return (
                    <tr key={run.id} className="group">
                      <td colSpan={isExpanded ? undefined : 1} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`} />
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${
                            isSuccess
                              ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                              : "bg-red-50 text-red-600 ring-red-200"
                          }`}>
                            {isSuccess ? "Success" : "Failure"}
                          </span>
                        </div>
                      </td>
                      {!isExpanded && (
                        <>
                          <td className="px-4 py-3 text-slate-600">{formatTimestamp(run.timestamp)}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                              {run.trigger === "workflow_dispatch" ? "Manual" : "Scheduled"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => setExpandedId(run.id)}
                              className="text-xs text-violet-600 hover:text-violet-800 transition-colors">
                              View
                            </button>
                          </td>
                        </>
                      )}
                      {isExpanded && (
                        <>
                          <td className="px-4 py-3 text-slate-600">{formatTimestamp(run.timestamp)}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                              {run.trigger === "workflow_dispatch" ? "Manual" : "Scheduled"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => setExpandedId(null)}
                              className="text-xs text-violet-600 hover:text-violet-800 transition-colors">
                              Hide
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Expanded output panel — rendered outside the table row for clean layout */}
            {expandedId !== null && (() => {
              const run = runs.find((r) => r.id === expandedId);
              if (!run) return null;
              return (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
                  <pre className="max-h-60 overflow-auto rounded-lg bg-white p-4 font-mono text-xs leading-relaxed text-slate-600 border border-slate-100">
                    {run.output}
                  </pre>
                </div>
              );
            })()}
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
      </div>
    </div>
  );
}
