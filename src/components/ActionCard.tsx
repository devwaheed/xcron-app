"use client";

import { useState } from "react";
import Link from "next/link";
import type { Action } from "@/types";
import GlassCard from "./GlassCard";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
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
  // Show a short timezone label (e.g. "America/New_York" → "EST" approximation)
  const shortTz = timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
  return `${hour}:${m} ${period} ${shortTz}`;
}

export default function ActionCard({
  action,
  onToggle,
  onTrigger,
  onDelete,
}: ActionCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isPaused = action.status === "paused";

  const handleDelete = () => {
    if (confirmingDelete) {
      onDelete(action.id);
      setConfirmingDelete(false);
    } else {
      setConfirmingDelete(true);
    }
  };

  return (
    <GlassCard
      className={`transition-all ${isPaused ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col gap-4">
        {/* Header: name + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              className={`truncate text-lg font-semibold ${
                isPaused ? "text-slate-400" : "text-white"
              }`}
            >
              {action.name}
            </h3>
            <p className="mt-1 text-sm text-slate-400">{formatTime(action)}</p>
          </div>

          {isPaused && (
            <span className="shrink-0 rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
              Paused
            </span>
          )}
          {!isPaused && (
            <span className="shrink-0 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
              Active
            </span>
          )}
        </div>

        {/* Day badges */}
        <div className="flex gap-1.5" title={buildDayTooltip(action)}>
          {DAY_LABELS.map((label, index) => {
            const isActive = action.schedule.days.includes(index);
            return (
              <span
                key={index}
                aria-label={DAY_NAMES[index]}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? isPaused
                      ? "bg-purple-500/30 text-purple-300"
                      : "bg-purple-500/40 text-purple-200"
                    : "bg-white/5 text-slate-600"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>

        {/* Actions row */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          {/* Toggle button */}
          <button
            onClick={() => onToggle(action.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isPaused
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
            }`}
            aria-label={isPaused ? "Resume action" : "Pause action"}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>

          {/* Run Now button */}
          <button
            onClick={() => onTrigger(action.id)}
            className="rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/30"
            aria-label="Run now"
          >
            Run Now
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Edit link */}
          <Link
            href={`/dashboard/${action.id}/edit`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Edit action"
          >
            Edit
          </Link>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            onBlur={() => setConfirmingDelete(false)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              confirmingDelete
                ? "bg-red-500/30 text-red-300"
                : "text-slate-400 hover:bg-red-500/20 hover:text-red-400"
            }`}
            aria-label={confirmingDelete ? "Confirm delete" : "Delete action"}
          >
            {confirmingDelete ? "Confirm?" : "Delete"}
          </button>
        </div>
      </div>
    </GlassCard>
  );
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
