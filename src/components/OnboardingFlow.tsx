"use client";

import { useState } from "react";
import type { Schedule } from "@/types";

export interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  scriptContent: string;
  schedule: Schedule;
}

export interface OnboardingFlowProps {
  onSelectTemplate: (template: ActionTemplate) => void;
  onDismiss: () => void;
}

const ONBOARDING_KEY = "xcron-onboarding-complete";

export function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingComplete(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: "health-check-ping",
    name: "Health Check Ping",
    description: "Ping an endpoint every weekday morning to verify it's up and responding.",
    scriptContent: `// Health Check Ping\nconst response = await fetch("https://example.com/health");\nif (!response.ok) throw new Error(\`Health check failed: \${response.status}\`);`,
    schedule: {
      days: [1, 2, 3, 4, 5], // Mon–Fri
      hour: 9,
      minute: 0,
      period: "AM",
      timezone: "UTC",
    },
  },
  {
    id: "database-backup",
    name: "Database Backup",
    description: "Run a daily database backup script in the early morning hours.",
    scriptContent: `// Database Backup\nconsole.log("Starting database backup...");\nconst timestamp = new Date().toISOString();\nconsole.log(\`Backup completed at \${timestamp}\`);`,
    schedule: {
      days: [0, 1, 2, 3, 4, 5, 6], // Every day
      hour: 2,
      minute: 0,
      period: "AM",
      timezone: "UTC",
    },
  },
  {
    id: "daily-report",
    name: "Daily Report",
    description: "Generate and send a summary report every weekday morning.",
    scriptContent: `// Daily Report Generation\nconst report = { date: new Date().toISOString(), status: "generated" };\nconsole.log("Report:", JSON.stringify(report));`,
    schedule: {
      days: [1, 2, 3, 4, 5], // Mon–Fri
      hour: 8,
      minute: 0,
      period: "AM",
      timezone: "UTC",
    },
  },
];

type Step = "welcome" | "templates";

export default function OnboardingFlow({
  onSelectTemplate,
  onDismiss,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>("welcome");

  function handleSkip() {
    markOnboardingComplete();
    onDismiss();
  }

  function handleSelectTemplate(template: ActionTemplate) {
    markOnboardingComplete();
    onSelectTemplate(template);
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/60 bg-white/70 p-8 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
        {step === "welcome" ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-violet-500"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-slate-800">
              Welcome to xCron
            </h2>
            <p className="mb-8 text-sm text-slate-500">
              Schedule scripts to run automatically — health checks, backups,
              reports, and more. Pick a template to get started in seconds.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setStep("templates")}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110"
              >
                Get Started
              </button>
              <button
                onClick={handleSkip}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                Skip
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-xl font-semibold text-slate-800">
              Choose a Template
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              Start with a pre-built template, or skip to create from scratch.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {ACTION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-violet-300 hover:shadow-md"
                >
                  <h3 className="mb-1 text-sm font-semibold text-slate-800 group-hover:text-violet-600">
                    {template.name}
                  </h3>
                  <p className="mb-3 flex-1 text-xs text-slate-500">
                    {template.description}
                  </p>
                  <span className="text-xs font-medium text-violet-500">
                    Use template →
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6">
              <button
                onClick={handleSkip}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
