"use client";

import Link from "next/link";
import type { Action } from "@/types";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

interface ActionCardProps {
  action: Action;
  onToggle: (id: string) => void | Promise<void>;
  onTrigger: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

function formatTime(action: Action): string {
  const { hour, minute, period, timezone } = action.schedule;
  const m = String(minute).padStart(2, "0");
  const shortTz = timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
  return `${hour}:${m} ${period} ${shortTz}`;
}

function buildDayTooltip(action: Action): string {
  const dayNames = action.schedule.days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES[d]);
  const { hour, minute, period, timezone } = action.schedule;
  const m = String(minute).padStart(2, "0");
  return `${dayNames.join(", ")} at ${hour}:${m} ${period} (${timezone})`;
}

export default function ActionCard({ action, onToggle, onTrigger, onDelete }: ActionCardProps) {
  const isPaused = action.status === "paused";
  const timeStr = formatTime(action);

  return (
    <div className={`group relative rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm shadow-slate-200/50 backdrop-blur-xl transition-all hover:border-slate-300/80 hover:shadow-md hover:shadow-slate-200/60 ${isPaused ? "opacity-60" : ""}`}>
      {/* Header — gradient frosted glass */}
      <div className={`flex items-center justify-between gap-3 rounded-t-2xl px-5 py-4 ${
        isPaused
          ? "bg-gradient-to-r from-slate-50/80 to-slate-100/60"
          : "bg-gradient-to-r from-white/80 to-indigo-50/60"
      } backdrop-blur-md`}>
        <div className="min-w-0">
          <h3 className={`truncate text-sm font-semibold ${isPaused ? "text-slate-400" : "text-slate-800"}`}>
            {action.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-xs text-slate-500 truncate">{timeStr}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
          isPaused
            ? "bg-amber-50 text-amber-600 ring-amber-200"
            : "bg-emerald-50 text-emerald-600 ring-emerald-200"
        }`}>
          {isPaused ? "Paused" : "Active"}
        </span>
      </div>

      {/* Body — day badges with time tooltip on each active day */}
      <div className="px-5 py-4">
        <div className="flex gap-1.5" title={buildDayTooltip(action)}>
          {DAY_LABELS.map((label, index) => {
            const isActive = action.schedule.days.includes(index);
            return (
              <span key={index} aria-label={DAY_NAMES[index]}
                title={isActive ? `${DAY_NAMES[index]} at ${timeStr}` : DAY_NAMES[index]}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-medium transition-colors cursor-default ${
                  isActive ? "bg-violet-100 text-violet-600" : "bg-slate-50 text-slate-300"
                }`}>
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer — icon-only actions with tooltips */}
      <div className="flex items-center gap-1 border-t border-slate-100/80 px-4 py-2.5">
        {/* Toggle: show Running (active) or Paused state, click to toggle */}
        <button onClick={() => onToggle(action.id)}
          title={isPaused ? "Resume action" : "Pause action"}
          aria-label={isPaused ? "Resume action" : "Pause action"}
          className={`inline-flex items-center justify-center rounded-lg p-2 transition-all ${
            isPaused
              ? "text-emerald-600 hover:bg-emerald-50"
              : "text-amber-600 hover:bg-amber-50"
          }`}>
          {isPaused ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          )}
          <span className="sr-only">{isPaused ? "Resume" : "Pause"}</span>
        </button>

        {/* Force run */}
        <button onClick={() => onTrigger(action.id)}
          title="Force run now"
          aria-label="Run now"
          className="inline-flex items-center justify-center rounded-lg p-2 text-violet-600 transition-all hover:bg-violet-50">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="sr-only">Run Now</span>
        </button>

        <div className="flex-1" />

        {/* Edit */}
        <Link href={`/dashboard/${action.id}/edit`}
          title="Edit action"
          aria-label="Edit action"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </Link>

        {/* History */}
        <Link href={`/dashboard/${action.id}/history`}
          title="View run history"
          aria-label="View run history"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </Link>

        {/* Delete */}
        <button onClick={() => onDelete(action.id)}
          title="Delete action"
          aria-label="Delete action"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span className="sr-only">Delete</span>
        </button>
      </div>
    </div>
  );
}
