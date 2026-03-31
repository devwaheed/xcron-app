"use client";

import { useState } from "react";
import GlassCard from "@/components/GlassCard";

interface ActionSettingsProps {
  envVars: Record<string, string>;
  onEnvVarsChange: (vars: Record<string, string>) => void;
  timeoutMinutes: number;
  onTimeoutChange: (v: number) => void;
  maxRetries: number;
  onMaxRetriesChange: (v: number) => void;
  retryDelaySeconds: number;
  onRetryDelayChange: (v: number) => void;
}

export default function ActionSettings({
  envVars, onEnvVarsChange,
  timeoutMinutes, onTimeoutChange,
  maxRetries, onMaxRetriesChange,
  retryDelaySeconds, onRetryDelayChange,
}: ActionSettingsProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  function addEnvVar() {
    const key = newKey.trim();
    if (!key) return;
    onEnvVarsChange({ ...envVars, [key]: newValue });
    setNewKey("");
    setNewValue("");
  }

  function removeEnvVar(key: string) {
    const next = { ...envVars };
    delete next[key];
    onEnvVarsChange(next);
  }

  const entries = Object.entries(envVars);

  return (
    <>
      {/* Environment Variables */}
      <GlassCard>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">4</div>
          <h2 className="text-base font-semibold text-slate-900">Environment Variables</h2>
          <span className="text-xs text-slate-400">Optional · max 20</span>
        </div>
        <p className="mb-4 text-sm text-slate-500">Key-value pairs injected into your script at runtime.</p>

        {entries.length > 0 && (
          <div className="mb-4 space-y-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <code className="text-xs font-semibold text-slate-700">{key}</code>
                <span className="text-xs text-slate-400">=</span>
                <code className="flex-1 truncate text-xs text-slate-500">
                  {value.length > 4 ? "•".repeat(value.length - 4) + value.slice(-4) : value}
                </code>
                <button type="button" onClick={() => removeEnvVar(key)}
                  className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
            ))}
          </div>
        )}

        {entries.length < 20 && (
          <div className="flex gap-2">
            <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)}
              placeholder="KEY" maxLength={100}
              className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
            <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)}
              placeholder="value" maxLength={500}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
            <button type="button" onClick={addEnvVar} disabled={!newKey.trim()}
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40">
              Add
            </button>
          </div>
        )}
      </GlassCard>

      {/* Execution Settings */}
      <GlassCard>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">5</div>
          <h2 className="text-base font-semibold text-slate-900">Execution Settings</h2>
        </div>

        <div className="space-y-5">
          {/* Timeout */}
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

          {/* Retries */}
          <div>
            <label htmlFor="retries" className="mb-1.5 block text-sm font-semibold text-slate-700">Retries on failure</label>
            <div className="flex items-center gap-2">
              <select id="retries" value={maxRetries}
                onChange={(e) => onMaxRetriesChange(parseInt(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
                <option value={0}>No retries</option>
                <option value={1}>1 retry</option>
                <option value={2}>2 retries</option>
                <option value={3}>3 retries</option>
              </select>
            </div>
          </div>

          {/* Retry delay */}
          {maxRetries > 0 && (
            <div>
              <label htmlFor="retry-delay" className="mb-1.5 block text-sm font-semibold text-slate-700">Delay between retries</label>
              <select id="retry-delay" value={retryDelaySeconds}
                onChange={(e) => onRetryDelayChange(parseInt(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={900}>15 minutes</option>
              </select>
            </div>
          )}
        </div>
      </GlassCard>
    </>
  );
}
