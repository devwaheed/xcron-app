"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Action, Schedule } from "@/types";
import GlassCard from "@/components/GlassCard";
import ScriptEditor from "@/components/ScriptEditor";
import SchedulePicker from "@/components/SchedulePicker";

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

export default function EditActionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const actionId = params.id;

  const [name, setName] = useState("");
  const [script, setScript] = useState("");
  const [schedule, setSchedule] = useState<Schedule>({
    days: [],
    hour: 9,
    minute: 0,
    period: "AM",
    timezone: "America/New_York",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function fetchAction() {
      try {
        const res = await fetch(`/api/actions/${actionId}`);
        if (!res.ok) {
          setLoadError("Failed to load action");
          setLoading(false);
          return;
        }
        const action: Action = await res.json();
        setName(action.name);
        setScript(action.scriptContent);
        setSchedule(action.schedule);
      } catch {
        setLoadError("Failed to load action");
      } finally {
        setLoading(false);
      }
    }
    fetchAction();
  }, [actionId]);

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
      const res = await fetch(`/api/actions/${actionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scriptContent: script, schedule }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setErrors({ api: data.error || "Failed to update action" });
        setSubmitting(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setErrors({ api: "Network error. Please try again." });
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <p className="text-slate-400">Loading action…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <GlassCard>
          <p className="text-red-300">{loadError}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            Back to Dashboard
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <header className="border-b border-white/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-white">Edit Action</h1>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <GlassCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {errors.api && (
              <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errors.api}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="action-name" className="mb-2 block text-sm font-medium text-white/70">
                Action Name
              </label>
              <input
                id="action-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Scheduled Action"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 backdrop-blur-xl focus:border-white/30 focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>

            {/* Script */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Script</label>
              <ScriptEditor value={script} onChange={setScript} />
              {errors.script && <p className="mt-1 text-sm text-red-400">{errors.script}</p>}
            </div>

            {/* Schedule */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Schedule</label>
              <SchedulePicker schedule={schedule} onChange={setSchedule} />
              {errors.days && <p className="mt-1 text-sm text-red-400">{errors.days}</p>}
              {errors.time && <p className="mt-1 text-sm text-red-400">{errors.time}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 hover:shadow-purple-500/40 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </GlassCard>
      </main>
    </div>
  );
}
