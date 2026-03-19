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
    scriptContent: `// Health Check Ping
// Replace the URL with your own endpoint
const url = "https://example.com/health";

const response = await fetch(url);
const status = response.status;
const body = await response.text();

if (!response.ok) {
  throw new Error(\`Health check failed: HTTP \${status} — \${body.slice(0, 200)}\`);
}

console.log(\`✓ Health check passed: HTTP \${status}\`);
console.log(\`Response: \${body.slice(0, 500)}\`);`,
    schedule: {
      days: [1, 2, 3, 4, 5],
      hour: 9,
      minute: 0,
      period: "AM",
      timezone: "UTC",
    },
  },
  {
    id: "api-data-fetch",
    name: "Daily API Fetch",
    description: "Fetch data from an API daily and log the results. Great for monitoring or data collection.",
    scriptContent: `// Daily API Data Fetch
// Replace with your API endpoint
const url = "https://jsonplaceholder.typicode.com/posts/1";

const response = await fetch(url);
if (!response.ok) throw new Error(\`API call failed: \${response.status}\`);

const data = await response.json();
console.log("Fetched data:", JSON.stringify(data, null, 2));
console.log(\`Completed at \${new Date().toISOString()}\`);`,
    schedule: {
      days: [0, 1, 2, 3, 4, 5, 6],
      hour: 7,
      minute: 0,
      period: "AM",
      timezone: "UTC",
    },
  },
  {
    id: "slack-notification",
    name: "Slack Notification",
    description: "Send a daily summary or reminder to a Slack channel via webhook.",
    scriptContent: `// Slack Notification
// Replace with your Slack webhook URL
const webhookUrl = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL";

const message = {
  text: \`📊 Daily update — \${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}\`,
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Daily Automated Report*\\nEverything is running smoothly. ✅"
      }
    }
  ]
};

const res = await fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(message),
});

if (!res.ok) throw new Error(\`Slack webhook failed: \${res.status}\`);
console.log("Slack notification sent successfully");`,
    schedule: {
      days: [1, 2, 3, 4, 5],
      hour: 9,
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
