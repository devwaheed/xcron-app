"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { Action } from "@/types";
import GlassCard from "@/components/GlassCard";
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

export default function EditActionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const actionId = params.id;

  const [data, setData] = useState<JobFormData>({
    name: "", script: "",
    schedule: { days: [], hour: 9, minute: 0, period: "AM", timezone: getLocalTimezone() },
    envVars: {}, timeoutMinutes: 5, maxRetries: 0, retryDelaySeconds: 60,
  });
  const [errors, setErrors] = useState<JobFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function fetchAction() {
      try {
        const res = await fetch(`/api/actions/${actionId}`);
        if (!res.ok) {
          const e = await parseApiResponse(res, "Failed to load action");
          setLoadError(e.message); setLoading(false); return;
        }
        const action: Action = await res.json();
        setData({
          name: action.name,
          script: action.scriptContent,
          schedule: action.schedule,
          envVars: action.envVars ?? {},
          timeoutMinutes: action.timeoutMinutes ?? 5,
          maxRetries: action.maxRetries ?? 0,
          retryDelaySeconds: action.retryDelaySeconds ?? 60,
        });
      } catch { setLoadError(networkErrorMessage("Failed to load action")); }
      finally { setLoading(false); }
    }
    fetchAction();
  }, [actionId]);

  async function handleSubmit() {
    const v = validateForm(data);
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(), scriptContent: data.script, schedule: data.schedule,
          envVars: data.envVars, timeoutMinutes: data.timeoutMinutes,
          maxRetries: data.maxRetries, retryDelaySeconds: data.retryDelaySeconds,
        }),
      });
      if (!res.ok) { const e = await parseApiResponse(res, "Failed to update job"); setErrors({ api: e.message }); return; }
      router.push("/dashboard");
    } catch { setErrors({ api: networkErrorMessage("Failed to update job") }); }
    finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
          <p className="text-sm text-slate-400">Loading job…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-32">
        <GlassCard>
          <p className="text-red-500">{loadError}</p>
          <button onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900">
            Back to Dashboard
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-xl font-semibold text-slate-900">Edit Job</h1>
          </div>
          <button type="button" onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
            Cancel
          </button>
        </div>

        <JobForm
          data={data} onChange={setData} errors={errors}
          onSubmit={handleSubmit} submitting={submitting}
          submitLabel="Save Changes" submittingLabel="Saving…"
        />
      </div>
    </div>
  );
}
