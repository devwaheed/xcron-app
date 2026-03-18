"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Action } from "@/types";
import ActionCard from "@/components/ActionCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { parseApiResponse, networkErrorMessage, getStatusMessage, isServiceError } from "@/lib/api-client";

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [serviceBanner, setServiceBanner] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [triggeringIds, setTriggeringIds] = useState<Set<string>>(new Set());

  /** Centralized error handler for all dashboard API calls. Returns true if error was handled. */
  async function handleError(res: Response, fallback: string): Promise<boolean> {
    if (res.ok) return false;

    const statusMsg = getStatusMessage(res.status);
    if (statusMsg) {
      showToast(statusMsg, "error");
      if (res.status === 401) router.push("/login");
      return true;
    }

    const apiError = await parseApiResponse(res, fallback);

    if (isServiceError(res.status)) {
      setServiceBanner(true);
    }

    showToast(apiError.message, "error");
    return true;
  }

  function handleNetworkFailure(context: string) {
    showToast(networkErrorMessage(context), "error");
  }

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch("/api/actions");
      if (await handleError(res, "Failed to load actions")) {
        setError("Failed to load actions"); return;
      }
      const data: Action[] = await res.json();
      setActions(data);
      setError("");
    } catch {
      handleNetworkFailure("Failed to load actions");
      setError("Failed to load actions");
    } finally { setLoading(false); }
  }, [showToast, router]);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  async function handleToggle(id: string) {
    setTogglingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/actions/${id}/toggle`, { method: "POST" });
      if (await handleError(res, "Failed to toggle action")) return;
      const action = actions.find((a) => a.id === id);
      const wasActive = action?.status === "active";
      showToast(wasActive ? "Action paused" : "Action resumed");
      await fetchActions();
    } catch { handleNetworkFailure("Failed to toggle action"); }
    finally { setTogglingIds((prev) => { const next = new Set(prev); next.delete(id); return next; }); }
  }

  async function handleTrigger(id: string) {
    setTriggeringIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/actions/${id}/trigger`, { method: "POST" });
      if (await handleError(res, "Failed to trigger action")) return;
      showToast("Action triggered successfully");
    } catch { handleNetworkFailure("Failed to trigger action"); }
    finally { setTriggeringIds((prev) => { const next = new Set(prev); next.delete(id); return next; }); }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/actions/${deleteTarget}`, { method: "DELETE" });
      if (await handleError(res, "Failed to delete action")) { setDeleting(false); return; }
      setDeleteTarget(null);
      showToast("Action deleted successfully");
      await fetchActions();
    } catch {
      handleNetworkFailure("Failed to delete action");
    } finally { setDeleting(false); }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      showToast("Failed to log out", "error");
    } finally {
      setLoggingOut(false);
    }
  }

  const activeCount = actions.filter((a) => a.status === "active").length;
  const pausedCount = actions.filter((a) => a.status === "paused").length;

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-100/60 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-100/50 blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 h-[400px] w-[400px] rounded-full bg-sky-100/40 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">xCron</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="hidden sm:inline">New Action</span>
            </Link>
            <button onClick={handleLogout} disabled={loggingOut}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50">
              {loggingOut ? "Logging out…" : "Log Out"}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Service connection banner */}
        {serviceBanner && (
          <div role="alert" data-testid="service-banner"
            className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 px-5 py-3.5 text-sm text-amber-700 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Service connection issue — the service may be inaccessible or the token may be invalid.</span>
            </div>
            <button onClick={() => setServiceBanner(false)} className="ml-4 shrink-0 rounded-lg p-1 text-amber-500 transition-all hover:bg-amber-100" aria-label="Dismiss service connection banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50/80 px-5 py-3.5 text-sm text-red-600 backdrop-blur-xl">{error}</div>
        )}

        {/* Stats bar */}
        {!loading && actions.length > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Actions</p>
                  <p className="text-xl font-semibold text-slate-800">{actions.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Active</p>
                  <p className="text-xl font-semibold text-emerald-600">{activeCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Paused</p>
                  <p className="text-xl font-semibold text-amber-600">{pausedCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              <p className="text-sm text-slate-400">Loading actions…</p>
            </div>
          </div>
        ) : actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-12 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="mb-2 text-lg font-semibold text-slate-800">No actions yet</p>
              <p className="mb-8 text-sm text-slate-500">Create your first scheduled action to get started.</p>
              <Link href="/dashboard/new"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110">
                Create Your First Action
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {actions.map((action) => (
              <ActionCard key={action.id} action={action}
                onToggle={handleToggle} onTrigger={handleTrigger} onDelete={(id) => setDeleteTarget(id)}
                toggling={togglingIds.has(action.id)} triggering={triggeringIds.has(action.id)} />
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        message="This will permanently remove the action, its script, and workflow from GitHub. This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => { if (!deleting) setDeleteTarget(null); }}
        loading={deleting}
      />
    </div>
  );
}
