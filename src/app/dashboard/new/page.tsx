"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Schedule } from "@/types";
import GlassCard from "@/components/GlassCard";
import ScriptEditor from "@/components/ScriptEditor";
import SchedulePicker, { getLocalTimezone } from "@/components/SchedulePicker";
import ActionSettings from "@/components/ActionSettings";
import { parseApiResponse, networkErrorMessage } from "@/lib/api-client";

interface FormErrors {
  name?: string;
  script?: string;
  days?: string;
  time?: string;
  api?: string;
}

function validateForm(name: string, script: string, schedule: Schedule): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim()) errors.name = "Name is required";
  if (!script.trim()) errors.script = "Script is required";
  if (schedule.days.length === 0) errors.days = "At least one day must be selected";
  if (schedule.hour < 1 || schedule.hour > 12 || schedule.minute < 0 || schedule.minute > 59) {
    errors.time = "Hour must be 1–12 and minute must be 0–59";
  }
  return errors;
}

export default function NewActionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [script, setScript] = useState("");
  const [schedule, setSchedule] = useState<Schedule>({
    days: [],
    hour: 9,
    minute: 0,
    period: "AM",
    timezone: getLocalTimezone(),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [timeoutMinutes, setTimeoutMinutes] = useState(5);
  const [maxRetries, setMaxRetries] = useState(0);
  const [retryDelaySeconds, setRetryDelaySeconds] = useState(60);
  const [actionSlots, setActionSlots] = useState<{ used: number; limit: number } | null>(null);
  const [atLimit, setAtLimit] = useState(false);

  useEffect(() => {
    async function loadProfileTimezone() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) { setSchedule((prev) => ({ ...prev, timezone: "UTC" })); return; }
        const profile = await res.json();
        if (profile.timezone) setSchedule((prev) => ({ ...prev, timezone: profile.timezone }));
      } catch { setSchedule((prev) => ({ ...prev, timezone: "UTC" })); }
    }
    async function loadUsage() {
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const data = await res.json();
          setActionSlots(data.actions);
          if (data.actions.used >= data.actions.limit) setAtLimit(true);
        }
      } catch { /* non-critical */ }
    }
    loadProfileTimezone();
    loadUsage();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateForm(name, script, schedule);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), scriptContent: script, schedule,
          envVars, timeoutMinutes, maxRetries, retryDelaySeconds,
        }),
      });
      if (!res.ok) {
        const apiError = await parseApiResponse(res, "Failed to create action");
        setErrors({ api: apiError.message });
        return;
      }
      router.push("/dashboard");
    } catch { setErrors({ api: networkErrorMessage("Failed to create action") }); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-slate-900">Create New Job</h1>
          </div>
          <button type="button" onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
            Cancel
          </button>
        </div>

        {atLimit ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center">
            <p className="text-sm font-medium text-amber-700">
              You have reached your job limit. Upgrade your plan or delete an existing job.
            </p>
            <a href="/pricing" className="mt-3 inline-block rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:brightness-110">
              Upgrade Plan
            </a>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {actionSlots && (
            <div className="text-xs font-medium text-slate-500">
              {actionSlots.limit - actionSlots.used} of {actionSlots.limit} job slots remaining
            </div>
          )}

          {errors.api && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600">{errors.api}</div>
          )}

          <GlassCard>
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">1</div>
              <h2 className="text-base font-semibold text-slate-900">Basics</h2>
            </div>
            <div>
              <label htmlFor="action-name" className="mb-1.5 block text-sm font-semibold text-slate-700">Action Name</label>
              <input id="action-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Daily Report, Cleanup Script"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
              <p className="mt-1.5 text-xs text-slate-500">A short, descriptive name for your scheduled action</p>
              {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">2</div>
              <h2 className="text-base font-semibold text-slate-900">Script</h2>
            </div>
            <div>
              <p className="mb-3 text-sm text-slate-500">The JavaScript code that will run on schedule.</p>
              <ScriptEditor value={script} onChange={setScript} />
              {errors.script && <p className="mt-1.5 text-sm text-red-500">{errors.script}</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">3</div>
              <h2 className="text-base font-semibold text-slate-900">Schedule</h2>
            </div>
            <SchedulePicker schedule={schedule} onChange={setSchedule} />
            {errors.days && <p className="mt-1.5 text-sm text-red-500">{errors.days}</p>}
            {errors.time && <p className="mt-1.5 text-sm text-red-500">{errors.time}</p>}
          </GlassCard>

          <ActionSettings
            envVars={envVars} onEnvVarsChange={setEnvVars}
            timeoutMinutes={timeoutMinutes} onTimeoutChange={setTimeoutMinutes}
            maxRetries={maxRetries} onMaxRetriesChange={setMaxRetries}
            retryDelaySeconds={retryDelaySeconds} onRetryDelayChange={setRetryDelaySeconds}
          />

          <div className="flex justify-end">
            <button type="submit" disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110 disabled:opacity-50">
              {submitting ? "Creating…" : "Create Action"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
