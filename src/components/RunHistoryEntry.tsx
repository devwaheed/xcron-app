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
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <button
        type="button"
        className="flex w-full flex-wrap items-center gap-2 text-left sm:gap-3"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-label={`Toggle output for run ${run.id}`}
      >
        {/* Status badge */}
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isSuccess
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {isSuccess ? "Success" : "Failure"}
        </span>

        {/* Timestamp */}
        <span className="min-w-0 text-sm text-slate-300">
          {formatTimestamp(run.timestamp)}
        </span>

        {/* Trigger */}
        <span className="text-xs text-slate-500">
          {run.trigger === "workflow_dispatch" ? "Manual" : "Scheduled"}
        </span>

        {/* Expand indicator */}
        <span className="ml-auto text-xs text-slate-500">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-slate-300">
          {run.output}
        </pre>
      )}
    </div>
  );
}
