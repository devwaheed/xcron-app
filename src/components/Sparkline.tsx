"use client";

import type { RunEntry } from "@/types";

interface SparklineProps {
  runs: RunEntry[];
  width?: number;
  height?: number;
}

/**
 * Tiny inline sparkline showing last N runs as colored bars.
 * Green = success, Red = failure, Gray = empty slot.
 */
export default function Sparkline({ runs, width = 120, height = 24 }: SparklineProps) {
  const maxBars = 15;
  // Pad to maxBars with nulls on the left (oldest side)
  const padded: (RunEntry | null)[] = [
    ...Array(Math.max(0, maxBars - runs.length)).fill(null),
    ...runs.slice(0, maxBars).reverse(), // oldest first
  ];

  const barWidth = Math.floor((width - (maxBars - 1)) / maxBars);
  const gap = 1;

  return (
    <svg width={width} height={height} className="shrink-0" aria-label="Run history sparkline">
      {padded.map((run, i) => {
        const x = i * (barWidth + gap);
        let fill = "#e2e8f0"; // slate-200 for empty
        if (run?.status === "success") fill = "#10b981"; // emerald-500
        if (run?.status === "failure") fill = "#ef4444"; // red-500
        return (
          <rect
            key={i}
            x={x}
            y={2}
            width={barWidth}
            height={height - 4}
            rx={2}
            fill={fill}
            opacity={run ? 1 : 0.3}
          />
        );
      })}
    </svg>
  );
}

/**
 * Calculate success rate from runs.
 */
export function calcSuccessRate(runs: RunEntry[]): number {
  if (runs.length === 0) return 100;
  const successes = runs.filter((r) => r.status === "success").length;
  return Math.round((successes / runs.length) * 100);
}
