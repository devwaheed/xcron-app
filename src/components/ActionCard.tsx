"use client";

import Link from "next/link";
import type { Action } from "@/types";
import { ClockIcon, PlayIcon, PauseIcon, EditIcon, TrashIcon } from "@/components/icons";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

interface ActionCardProps {
  action: Action;
  onToggle: (id: string) => void | Promise<void>;
  onTrigger: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  toggling?: boolean;
  triggering?: boolean;
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
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

export default function ActionCard({ action, onToggle, onTrigger, onDelete, toggling = false, triggering = false }: ActionCardProps) {
  const isPaused = action.status === "paused";
  const timeStr = formatTime(action);
  const busy = toggling || triggering;

  return (
    <div className={`group relative rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm shadow-slate-200/50 backdrop-blur-xl transition-all hover:border-slate-300/80 hover:shadow-md hover:shadow-slate-200/60 ${isPaused ? "opacity-60" : ""}`}>
      {/* Header — gradient frosted glass */}
      <div className={`flex items-center justify-between gap-3 rounded-t-2xl px-5 py-4 ${
        isPaused
          ? "bg-gradient-to-r from-slate-100 to-slate-200/80"
          : "bg-gradient-to-r from-violet-100 to-indigo-100"
      }`}>
        <div className="min-w-0">
          <h3 className={`truncate text-base font-semibold ${isPaused ? "text-slate-400" : "text-slate-800"}`}>
            {action.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ClockIcon size={11} className="text-slate-400 shrink-0" />
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
          disabled={busy}
          title={isPaused ? "Resume action" : "Pause action"}
          aria-label={isPaused ? "Resume action" : "Pause action"}
          className={`inline-flex items-center justify-center rounded-lg p-2 transition-all disabled:opacity-50 ${
            isPaused
              ? "text-emerald-600 hover:bg-emerald-50"
              : "text-amber-600 hover:bg-amber-50"
          }`}>
          {toggling ? (
            <Spinner />
          ) : isPaused ? (
            <PlayIcon size={15} color="currentColor" />
          ) : (
            <PauseIcon size={15} color="currentColor" />
          )}
          <span className="sr-only">{isPaused ? "Resume" : "Pause"}</span>
        </button>

        {/* Force run */}
        <button onClick={() => onTrigger(action.id)}
          disabled={busy}
          title="Force run now"
          aria-label="Run now"
          className="inline-flex items-center justify-center rounded-lg p-2 text-violet-600 transition-all hover:bg-violet-50 disabled:opacity-50">
          {triggering ? (
            <Spinner />
          ) : (
            <PlayIcon size={15} color="currentColor" />
          )}
          <span className="sr-only">Run Now</span>
        </button>

        <div className="flex-1" />

        {/* Edit */}
        <Link href={`/dashboard/${action.id}/edit`}
          title="Edit action"
          aria-label="Edit action"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600">
          <EditIcon size={15} color="currentColor" />
        </Link>

        {/* History */}
        <Link href={`/dashboard/${action.id}/history`}
          title="View run history"
          aria-label="View run history"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600">
          <ClockIcon size={15} color="currentColor" />
        </Link>

        {/* Delete */}
        <button onClick={() => onDelete(action.id)}
          disabled={busy}
          title="Delete action"
          aria-label="Delete action"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
          <TrashIcon size={15} color="currentColor" />
          <span className="sr-only">Delete</span>
        </button>
      </div>
    </div>
  );
}
