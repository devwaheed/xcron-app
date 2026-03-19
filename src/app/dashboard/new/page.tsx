"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Schedule } from "@/types";
import GlassCard from "@/components/GlassCard";
import ScriptEditor from "@/components/ScriptEditor";
import SchedulePicker, { getLocalTimezone } from "@/components/SchedulePicker";
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

  useEffect(() => {
    async function loadProfileTimezone() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          setSchedule((prev) => ({ ...prev, timezone: "UTC" }));
          return;
        }
        const profile = await res.json();
        if (profile.timezone) {
          setSchedule((prev) => ({ ...prev, timezone: profile.timezone }));
        }
      } catch {
        setSchedule((prev) => ({ ...prev, timezone: "UTC" }));
      }
    }
    loadProfileTimezone();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateForm(name, script, schedule);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scriptContent: script, schedule }),
      });

      if (!res.ok) {
        const apiError = await parseApiResponse(res, "Failed to create action");
        setErrors({ api: apiError.message });
        return;
      }

      router.push("/dashboard");
    } catch {
      setErrors({ api: networkErrorMessage("Failed to create action") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-100/60 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-100/50 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">Create New Action</h1>
          </div>
          <button type="button" onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
            Cancel
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {errors.api && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600">
              {errors.api}
            </div>
          )}

          {/* Section 1: Basics */}
          <GlassCard>
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">1</div>
              <h2 className="text-base font-semibold text-slate-900">Basics</h2>
            </div>
            <div>
              <label htmlFor="action-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Action Name
              </label>
              <input
                id="action-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Daily Report, Cleanup Script"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
              <p className="mt-1.5 text-xs text-slate-500">A short, descriptive name for your scheduled action</p>
              {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>}
            </div>
          </GlassCard>

          {/* Section 2: Script */}
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

          {/* Section 3: Schedule */}
          <GlassCard>
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">3</div>
              <h2 className="text-base font-semibold text-slate-900">Schedule</h2>
            </div>
            <SchedulePicker schedule={schedule} onChange={setSchedule} />
            {errors.days && <p className="mt-1.5 text-sm text-red-500">{errors.days}</p>}
            {errors.time && <p className="mt-1.5 text-sm text-red-500">{errors.time}</p>}
          </GlassCard>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create Action"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
