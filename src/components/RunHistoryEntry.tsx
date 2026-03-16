"use client";

import { useState } from "react";
import type { RunEntry } from "@/types";

interface RunHistoryEntryProps {
  run: RunEntry;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function RunHistoryEntry({ run }: RunHistoryEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess = run.status === "success";

  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/70 shadow-sm shadow-slate-200/50 backdrop-blur-xl transition-all hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/60">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-label={`Toggle output for run ${run.id}`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`} />

        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1 ${
          isSuccess
            ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
            : "bg-red-50 text-red-600 ring-red-200"
        }`}>
          {isSuccess ? "Success" : "Failure"}
        </span>

        <span className="min-w-0 text-sm text-slate-600">{formatTimestamp(run.timestamp)}</span>

        <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-400">
          {run.trigger === "workflow_dispatch" ? "Manual" : "Scheduled"}
        </span>

        <span className={`ml-auto text-xs text-slate-300 transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4">
          <pre className="max-h-60 overflow-auto rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-600">
            {run.output}
          </pre>
        </div>
      )}
    </div>
  );
}
