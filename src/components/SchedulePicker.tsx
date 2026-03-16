"use client";

import type { Schedule } from "@/types";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

const BASE_TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "America/Toronto", "America/Vancouver",
  "America/Sao_Paulo", "America/Argentina/Buenos_Aires", "Europe/London",
  "Europe/Paris", "Europe/Berlin", "Europe/Moscow", "Asia/Dubai", "Asia/Kolkata",
  "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul", "Asia/Singapore",
  "Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland", "UTC",
];

function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function getTimezones(): string[] {
  const local = getLocalTimezone();
  if (BASE_TIMEZONES.includes(local)) return BASE_TIMEZONES;
  return [local, ...BASE_TIMEZONES];
}

// Keep TIMEZONES as a stable export for tests — it's the base list
const TIMEZONES = BASE_TIMEZONES;

interface SchedulePickerProps {
  schedule: Schedule;
  onChange: (schedule: Schedule) => void;
}

const QUICK_PRESETS = [
  { label: "Weekdays", days: [1, 2, 3, 4, 5] },
  { label: "Weekends", days: [0, 6] },
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
] as const;

export default function SchedulePicker({ schedule, onChange }: SchedulePickerProps) {
  const timezones = getTimezones();
  const localTz = getLocalTimezone();
  const isLocal = schedule.timezone === localTz;

  function toggleDay(day: number) {
    const days = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day].sort((a, b) => a - b);
    onChange({ ...schedule, days });
  }

  function applyPreset(days: readonly number[]) {
    onChange({ ...schedule, days: [...days] });
  }

  function setHour(value: string) {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) onChange({ ...schedule, hour: num });
  }

  function setMinute(value: string) {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) onChange({ ...schedule, minute: num });
  }

  function togglePeriod() {
    onChange({ ...schedule, period: schedule.period === "AM" ? "PM" : "AM" });
  }

  function setTimezone(value: string) {
    onChange({ ...schedule, timezone: value });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Days section */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Run on</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_PRESETS.map((preset) => {
            const active = preset.days.length === schedule.days.length &&
              preset.days.every((d) => schedule.days.includes(d));
            return (
              <button key={preset.label} type="button" onClick={() => applyPreset(preset.days)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-300/40"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                }`}>
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {DAY_LABELS.map((label, index) => {
            const active = schedule.days.includes(index);
            return (
              <button key={index} type="button" onClick={() => toggleDay(index)}
                title={DAY_NAMES[index]} aria-label={DAY_NAMES[index]} aria-pressed={active}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-300/30"
                    : "border border-slate-300 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                }`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time section */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">At</label>
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={12} value={schedule.hour} onChange={(e) => setHour(e.target.value)} aria-label="Hour"
            className="w-16 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-900 shadow-sm transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          <span className="text-lg font-bold text-slate-400">:</span>
          <input type="number" min={0} max={59} value={String(schedule.minute).padStart(2, "0")} onChange={(e) => setMinute(e.target.value)} aria-label="Minute"
            className="w-16 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-900 shadow-sm transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          <button type="button" onClick={togglePeriod} aria-label={`Toggle to ${schedule.period === "AM" ? "PM" : "AM"}`}
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-100">
            {schedule.period}
          </button>
        </div>
      </div>

      {/* Timezone section */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Timezone</label>
        <select value={schedule.timezone} onChange={(e) => setTimezone(e.target.value)} aria-label="Timezone"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}{tz === localTz ? " (your timezone)" : ""}
            </option>
          ))}
        </select>
        {isLocal && (
          <p className="mt-1.5 text-xs text-slate-500">Auto-detected from your browser</p>
        )}
      </div>
    </div>
  );
}

export { TIMEZONES, getLocalTimezone, getTimezones };
