"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Schedule } from "@/types";
import JobForm, { type JobFormData, type JobFormErrors } from "@/components/JobForm";
import { getLocalTimezone } from "@/components/SchedulePicker";
import { parseApiResponse, networkErrorMessage } from "@/lib/api-client";

function validateForm(data: JobFormData): JobFormErrors {
  const errors: JobFormErrors = {};
  if (!data.name.trim()) errors.name = "Name is required";
  if (!data.script.trim()) errors.script = "Script is required";
  if (data.schedule.days.length === 0) errors.days = "At least one day must be selected";
  if (data.schedule.hour < 1 || data.schedule.hour > 12 || data.schedule.minute < 0 || data.schedule.minute > 59) {
    errors.time = "Hour must be 1–12 and minute must be 0–59";
  }
  return errors;
}

export default function NewActionPage() {
  const router = useRouter();
  const [data, setData] = useState<JobFormData>({
    name: "", script: "",
    schedule: { days: [], hour: 9, minute: 0, period: "AM", timezone: getLocalTimezone() },
    envVars: {}, timeoutMinutes: 5, maxRetries: 0, retryDelaySeconds: 60,
  });
  const [errors, setErrors] = useState<JobFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [actionSlots, setActionSlots] = useState<{ used: number; limit: number } | null>(null);
  const [atLimit, setAtLimit] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.ok ? r.json() : null).then(p => {
      if (p?.timezone) setData(d => ({ ...d, schedule: { ...d.schedule, timezone: p.timezone } }));
    }).catch(() => {});
    fetch("/api/usage").then(r => r.ok ? r.json() : null).then(u => {
      if (u) { setActionSlots(u.actions); if (u.actions.used >= u.actions.limit) setAtLimit(true); }
    }).catch(() => {});
  }, []);

  async function handleSubmit() {
    const v = validateForm(data);
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(), scriptContent: data.script, schedule: data.schedule,
          envVars: data.envVars, timeoutMinutes: data.timeoutMinutes,
          maxRetries: data.maxRetries, retryDelaySeconds: data.retryDelaySeconds,
        }),
      });
      if (!res.ok) { const e = await parseApiResponse(res, "Failed to create job"); setErrors({ api: e.message }); return; }
      router.push("/dashboard");
    } catch { setErrors({ api: networkErrorMessage("Failed to create job") }); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
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
            <p className="text-sm font-medium text-amber-700">You have reached your job limit. Upgrade your plan or delete an existing job.</p>
            <a href="/pricing" className="mt-3 inline-block rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:brightness-110">Upgrade Plan</a>
          </div>
        ) : (
          <JobForm
            data={data} onChange={setData} errors={errors}
            onSubmit={handleSubmit} submitting={submitting}
            submitLabel="Create Job" submittingLabel="Creating…"
            header={actionSlots ? (
              <div className="text-xs font-medium text-slate-500">
                {actionSlots.limit - actionSlots.used} of {actionSlots.limit} job slots remaining
              </div>
            ) : undefined}
          />
        )}
      </div>
    </div>
  );
}
