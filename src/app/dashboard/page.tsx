"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Action } from "@/types";
import ActionCard from "@/components/ActionCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { parseApiResponse, networkErrorMessage, getStatusMessage, isServiceError } from "@/lib/api-client";
import { isOnboardingComplete } from "@/components/OnboardingFlow";
import OnboardingFlow from "@/components/OnboardingFlow";
import EmptyState from "@/components/ui/EmptyState";
import CommandPalette from "@/components/ui/CommandPalette";
import type { Command } from "@/components/ui/CommandPalette";
import { useShortcut } from "@/lib/shortcuts";
import { useTheme } from "@/components/ThemeProvider";
import type { ThemeMode } from "@/lib/theme";
import { PlusIcon, AlertTriangleIcon, XCloseIcon, PauseIcon } from "@/components/icons";


export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { mode, setMode } = useTheme();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [serviceBanner, setServiceBanner] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [triggeringIds, setTriggeringIds] = useState<Set<string>>(new Set());
  const [paletteOpen, setPaletteOpen] = useState(false);

  const cycleTheme = useCallback(() => {
    const order: ThemeMode[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setMode(next);
  }, [mode, setMode]);

  useShortcut("n", () => router.push("/dashboard/new"));
  useShortcut("t", cycleTheme);
  useShortcut("k", () => setPaletteOpen((prev) => !prev), { meta: true, preventDefault: true });

  async function handleError(res: Response, fallback: string): Promise<boolean> {
    if (res.ok) return false;
    const statusMsg = getStatusMessage(res.status);
    if (statusMsg) {
      showToast(statusMsg, "error");
      if (res.status === 401) router.push("/login");
      return true;
    }
    const apiError = await parseApiResponse(res, fallback);
    if (isServiceError(res.status)) setServiceBanner(true);
    showToast(apiError.message, "error");
    return true;
  }

  function handleNetworkFailure(context: string) {
    showToast(networkErrorMessage(context), "error");
  }

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch("/api/actions");
      if (await handleError(res, "Failed to load actions")) { setError("Failed to load actions"); return; }
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
      showToast(action?.status === "active" ? "Action paused" : "Action resumed");
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
    } catch { handleNetworkFailure("Failed to delete action"); }
    finally { setDeleting(false); }
  }

  const activeCount = actions.filter((a) => a.status === "active").length;
  const pausedCount = actions.filter((a) => a.status === "paused").length;

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      { id: "nav-dashboard", label: "Go to Dashboard", action: () => router.push("/dashboard"), category: "navigation" },
      { id: "nav-new", label: "New Job", shortcut: "N", action: () => router.push("/dashboard/new"), category: "action" },
      { id: "toggle-theme", label: "Toggle Theme", shortcut: "T", action: cycleTheme, category: "settings" },
    ];
    for (const action of actions) {
      cmds.push({
        id: `nav-action-${action.id}`,
        label: `Go to ${action.name}`,
        action: () => router.push(`/dashboard/${action.id}/edit`),
        category: "navigation",
      });
    }
    return cmds;
  }, [actions, router, cycleTheme]);

  return (
    <div className="px-6 py-8 lg:px-10">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your scheduled jobs</p>
        </div>
        <Link href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110">
          <PlusIcon size={14} />
          New Job
        </Link>
      </div>

      {/* Service connection banner */}
      {serviceBanner && (
        <div role="alert" data-testid="service-banner"
          className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 px-5 py-3.5 text-sm text-amber-700">
          <div className="flex items-center gap-2.5">
            <AlertTriangleIcon size={16} className="shrink-0 text-amber-500" />
            <span>Service connection issue — the service may be inaccessible or the token may be invalid.</span>
          </div>
          <button onClick={() => setServiceBanner(false)} className="ml-4 shrink-0 rounded-lg p-1 text-amber-500 transition-all hover:bg-amber-100" aria-label="Dismiss service connection banner">
            <XCloseIcon size={14} />
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50/80 px-5 py-3.5 text-sm text-red-600">{error}</div>
      )}

      {/* Stats bar */}
      {!loading && actions.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm shadow-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Jobs</p>
                <p className="text-xl font-semibold text-slate-800">{actions.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm shadow-slate-200/50">
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
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm shadow-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <PauseIcon size={18} className="text-amber-500" />
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
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm shadow-slate-200/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                    <div className="h-5 w-8 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm shadow-slate-200/50">
                <div className="flex items-center justify-between gap-3 rounded-t-2xl bg-gradient-to-r from-slate-100 to-slate-50 px-5 py-4">
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200/70" />
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-200/50" />
                  </div>
                  <div className="h-6 w-14 animate-pulse rounded-full bg-slate-200/60" />
                </div>
                <div className="px-5 py-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                      <div key={d} className="h-7 w-7 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 border-t border-slate-100/80 px-4 py-2.5">
                  {[0, 1, 2, 3, 4].map((b) => (
                    <div key={b} className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : actions.length === 0 ? (
        isOnboardingComplete() ? (
          <EmptyState
            illustration="no-actions"
            heading="No jobs yet"
            description="Create your first scheduled job to get started."
            action={{ label: "Create Your First Job", onClick: () => router.push("/dashboard/new") }}
          />
        ) : (
          <OnboardingFlow
            onSelectTemplate={() => router.push("/dashboard/new")}
            onDismiss={() => fetchActions()}
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <ActionCard key={action.id} action={action}
              onToggle={handleToggle} onTrigger={handleTrigger} onDelete={(id) => setDeleteTarget(id)}
              toggling={togglingIds.has(action.id)} triggering={triggeringIds.has(action.id)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        message="This will permanently remove the job, its script, and workflow from GitHub. This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => { if (!deleting) setDeleteTarget(null); }}
        loading={deleting}
      />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
    </div>
  );
}
