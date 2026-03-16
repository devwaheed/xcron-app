"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Action } from "@/types";
import ActionCard from "@/components/ActionCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

/**
 * Handles an API response by status code:
 * - 401 → redirect to login
 * - 429 → rate limit toast
 * - 502 → GitHub connection banner + toast
 * - other 4xx/5xx → generic error toast
 * Returns true if an error was handled (caller should stop).
 */
function handleApiError(
  res: Response,
  context: string,
  showToast: (msg: string, variant?: "success" | "error") => void,
  router: ReturnType<typeof useRouter>,
  setGitHubBanner: (v: boolean) => void,
): boolean {
  if (res.ok) return false;

  if (res.status === 401) {
    showToast("Session expired. Redirecting to login…", "error");
    router.push("/login");
    return true;
  }

  if (res.status === 429) {
    showToast("Rate limit exceeded. Please wait and try again.", "error");
    return true;
  }

  if (res.status === 502) {
    setGitHubBanner(true);
    showToast(`GitHub connection issue: ${context}`, "error");
    return true;
  }

  // Other 4xx / 5xx
  showToast(`Something went wrong: ${context}`, "error");
  return true;
}

function handleNetworkError(
  context: string,
  showToast: (msg: string, variant?: "success" | "error") => void,
) {
  showToast(`Connection failed: ${context}. Check your network and try again.`, "error");
}

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [gitHubBanner, setGitHubBanner] = useState(false);

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch("/api/actions");
      if (handleApiError(res, "Failed to load actions", showToast, router, setGitHubBanner)) {
        setError("Failed to load actions");
        return;
      }
      const data: Action[] = await res.json();
      setActions(data);
      setError("");
    } catch {
      handleNetworkError("Failed to load actions", showToast);
      setError("Failed to load actions");
    } finally {
      setLoading(false);
    }
  }, [showToast, router]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  async function handleToggle(id: string) {
    try {
      const res = await fetch(`/api/actions/${id}/toggle`, { method: "POST" });
      if (handleApiError(res, "Failed to toggle action", showToast, router, setGitHubBanner)) {
        return;
      }
      await fetchActions();
    } catch {
      handleNetworkError("Failed to toggle action", showToast);
    }
  }

  async function handleTrigger(id: string) {
    try {
      const res = await fetch(`/api/actions/${id}/trigger`, { method: "POST" });
      if (handleApiError(res, "Failed to trigger action", showToast, router, setGitHubBanner)) {
        return;
      }
    } catch {
      handleNetworkError("Failed to trigger action", showToast);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/actions/${deleteTarget}`, { method: "DELETE" });
      if (handleApiError(res, "Failed to delete action", showToast, router, setGitHubBanner)) {
        return;
      }
      setDeleteTarget(null);
      await fetchActions();
    } catch {
      handleNetworkError("Failed to delete action", showToast);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      showToast("Failed to log out", "error");
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-white">Cron Job Builder</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/new"
              className="whitespace-nowrap rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 hover:shadow-purple-500/40 sm:px-4 sm:text-sm"
            >
              <span className="hidden sm:inline">Create New Action</span>
              <span className="sm:hidden">+ New</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              {loggingOut ? "Logging out…" : "Log Out"}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Persistent GitHub connection banner */}
        {gitHubBanner && (
          <div
            role="alert"
            data-testid="github-banner"
            className="mb-6 flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
          >
            <span>
              ⚠ GitHub connection issue — the repository may be inaccessible or the token may be invalid. Some operations may fail.
            </span>
            <button
              onClick={() => setGitHubBanner(false)}
              className="ml-4 shrink-0 text-sm opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss GitHub connection banner"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-400">Loading actions…</p>
          </div>
        ) : actions.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <p className="mb-2 text-lg font-semibold text-white">
                No actions yet
              </p>
              <p className="mb-6 text-sm text-slate-400">
                Create your first scheduled action to get started.
              </p>
              <Link
                href="/dashboard/new"
                className="inline-block rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 hover:shadow-purple-500/40"
              >
                Create Your First Action
              </Link>
            </div>
          </div>
        ) : (
          /* Action cards grid */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onToggle={handleToggle}
                onTrigger={handleTrigger}
                onDelete={(id) => setDeleteTarget(id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        message="Are you sure you want to delete this action? This will remove the script and workflow from GitHub. This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
