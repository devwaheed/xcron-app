"use client";

import type { Schedule } from "@/types";

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

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Singapore",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "UTC",
];

function getLocalTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONES.includes(tz) ? tz : TIMEZONES[0];
  } catch {
    return TIMEZONES[0];
  }
}

interface SchedulePickerProps {
  schedule: Schedule;
  onChange: (schedule: Schedule) => void;
}

export default function SchedulePicker({ schedule, onChange }: SchedulePickerProps) {
  function toggleDay(day: number) {
    const days = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day].sort((a, b) => a - b);
    onChange({ ...schedule, days });
  }

  function setHour(value: string) {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      onChange({ ...schedule, hour: num });
    }
  }

  function setMinute(value: string) {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      onChange({ ...schedule, minute: num });
    }
  }

  function togglePeriod() {
    onChange({ ...schedule, period: schedule.period === "AM" ? "PM" : "AM" });
  }

  function setTimezone(value: string) {
    onChange({ ...schedule, timezone: value });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Day checkboxes */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">Days</label>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, index) => {
            const active = schedule.days.includes(index);
            return (
              <button
                key={index}
                type="button"
                onClick={() => toggleDay(index)}
                title={DAY_NAMES[index]}
                aria-label={DAY_NAMES[index]}
                aria-pressed={active}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-purple-500/40 text-purple-200"
                    : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time picker */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">Time</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={12}
            value={schedule.hour}
            onChange={(e) => setHour(e.target.value)}
            aria-label="Hour"
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white backdrop-blur-xl focus:border-white/30 focus:outline-none"
          />
          <span className="text-white/50">:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={String(schedule.minute).padStart(2, "0")}
            onChange={(e) => setMinute(e.target.value)}
            aria-label="Minute"
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white backdrop-blur-xl focus:border-white/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={togglePeriod}
            aria-label={`Toggle to ${schedule.period === "AM" ? "PM" : "AM"}`}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            {schedule.period}
          </button>
        </div>
      </div>

      {/* Timezone dropdown */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">Timezone</label>
        <select
          value={schedule.timezone}
          onChange={(e) => setTimezone(e.target.value)}
          aria-label="Timezone"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-xl focus:border-white/30 focus:outline-none"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz} className="bg-slate-900 text-white">
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export { TIMEZONES, getLocalTimezone };
