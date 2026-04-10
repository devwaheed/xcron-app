"use client";

import { useState } from "react";
import type { Schedule } from "@/types";
import ScriptEditor from "@/components/ScriptEditor";
import SchedulePicker from "@/components/SchedulePicker";
import ActionSettings from "@/components/ActionSettings";

export interface JobFormData {
  name: string;
  script: string;
  schedule: Schedule;
  envVars: Record<string, string>;
  timeoutMinutes: number;
  maxRetries: number;
  retryDelaySeconds: number;
}

export interface JobFormErrors {
  name?: string;
  script?: string;
  days?: string;
  time?: string;
  api?: string;
}

interface JobFormProps {
  data: JobFormData;
  onChange: (data: JobFormData) => void;
  errors: JobFormErrors;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  /** Extra content above the form (e.g. slot remaining info) */
  header?: React.ReactNode;
}

const TABS = [
  { id: "script", label: "Script", icon: "M16 18l6-6-6-6M8 6l-6 6 6 6" },
  { id: "schedule", label: "Schedule", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "env", label: "Variables", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
  { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function JobForm({ data, onChange, errors, onSubmit, submitting, submitLabel, submittingLabel, header }: JobFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>("script");

  function update(partial: Partial<JobFormData>) {
    onChange({ ...data, ...partial });
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
      {header}

      {errors.api && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600">{errors.api}</div>
      )}

      {/* Name field — always visible */}
      <div>
        <label htmlFor="job-name" className="mb-1.5 block text-sm font-semibold text-slate-700">Job Name</label>
        <input id="job-name" type="text" value={data.name} onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Daily Report, Health Check"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
        {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* Validation errors summary — visible regardless of active tab */}
      {(errors.script || errors.days || errors.time) && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 space-y-1">
          {errors.script && <p>{errors.script}</p>}
          {errors.days && <p>{errors.days}</p>}
          {errors.time && <p>{errors.time}</p>}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-1" aria-label="Job settings tabs">
          {TABS.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-slate-400 hover:border-slate-300 hover:text-slate-600"
              }`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-[320px]">
        {activeTab === "script" && (
          <div>
            <p className="mb-3 text-sm text-slate-500">The JavaScript code that will run on schedule.</p>
            <ScriptEditor value={data.script} onChange={(v) => update({ script: v })} />
          </div>
        )}

        {activeTab === "schedule" && (
          <div>
            <SchedulePicker schedule={data.schedule} onChange={(s) => update({ schedule: s })} />
          </div>
        )}

        {activeTab === "env" && (
          <EnvVarsPanel envVars={data.envVars} onChange={(v) => update({ envVars: v })} />
        )}

        {activeTab === "settings" && (
          <SettingsPanel
            timeoutMinutes={data.timeoutMinutes} onTimeoutChange={(v) => update({ timeoutMinutes: v })}
            maxRetries={data.maxRetries} onMaxRetriesChange={(v) => update({ maxRetries: v })}
            retryDelaySeconds={data.retryDelaySeconds} onRetryDelayChange={(v) => update({ retryDelaySeconds: v })}
          />
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button type="submit" disabled={submitting}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110 disabled:opacity-50">
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ── Inline sub-panels (no numbered cards, cleaner inside tabs) ── */

function EnvVarsPanel({ envVars, onChange }: { envVars: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const entries = Object.entries(envVars);

  function add() {
    const key = newKey.trim();
    if (!key) return;
    onChange({ ...envVars, [key]: newValue });
    setNewKey(""); setNewValue("");
  }

  function remove(key: string) {
    const next = { ...envVars };
    delete next[key];
    onChange(next);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">Key-value pairs injected into your script at runtime. Max 20.</p>
      {entries.length > 0 && (
        <div className="mb-4 space-y-2">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <code className="text-xs font-semibold text-slate-700">{key}</code>
              <span className="text-xs text-slate-400">=</span>
              <code className="flex-1 truncate text-xs text-slate-500">
                {value.length > 4 ? "•".repeat(Math.min(value.length - 4, 20)) + value.slice(-4) : value}
              </code>
              <button type="button" onClick={() => remove(key)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
            </div>
          ))}
        </div>
      )}
      {entries.length < 20 && (
        <div className="flex gap-2">
          <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="KEY" maxLength={100}
            className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="value" maxLength={500}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          <button type="button" onClick={add} disabled={!newKey.trim()}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40">Add</button>
        </div>
      )}
      {entries.length === 0 && (
        <p className="mt-2 text-xs text-slate-400">No environment variables set. Add one above.</p>
      )}
    </div>
  );
}

function SettingsPanel({ timeoutMinutes, onTimeoutChange, maxRetries, onMaxRetriesChange, retryDelaySeconds, onRetryDelayChange }: {
  timeoutMinutes: number; onTimeoutChange: (v: number) => void;
  maxRetries: number; onMaxRetriesChange: (v: number) => void;
  retryDelaySeconds: number; onRetryDelayChange: (v: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="timeout" className="mb-1.5 block text-sm font-semibold text-slate-700">Timeout</label>
        <div className="flex items-center gap-2">
          <input id="timeout" type="number" min={1} max={30} value={timeoutMinutes}
            onChange={(e) => onTimeoutChange(Math.min(30, Math.max(1, parseInt(e.target.value) || 5)))}
            className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          <span className="text-sm text-slate-500">minutes (1–30)</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Script will be killed if it exceeds this duration.</p>
      </div>
      <div>
        <label htmlFor="retries" className="mb-1.5 block text-sm font-semibold text-slate-700">Retries on failure</label>
        <select id="retries" value={maxRetries} onChange={(e) => onMaxRetriesChange(parseInt(e.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
          <option value={0}>No retries</option>
          <option value={1}>1 retry</option>
          <option value={2}>2 retries</option>
          <option value={3}>3 retries</option>
        </select>
      </div>
      {maxRetries > 0 && (
        <div>
          <label htmlFor="retry-delay" className="mb-1.5 block text-sm font-semibold text-slate-700">Delay between retries</label>
          <select id="retry-delay" value={retryDelaySeconds} onChange={(e) => onRetryDelayChange(parseInt(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
            <option value={900}>15 minutes</option>
          </select>
        </div>
      )}
    </div>
  );
}
