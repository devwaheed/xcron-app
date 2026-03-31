export interface Schedule {
  days: number[];        // 0=Sun, 1=Mon, ..., 6=Sat
  hour: number;          // 1–12
  minute: number;        // 0–59
  period: 'AM' | 'PM';
  timezone: string;      // IANA timezone
}

export interface RunEntry {
  id: number;
  status: 'success' | 'failure';
  timestamp: string;     // ISO 8601
  output: string;        // Log excerpt or error message
  trigger: 'schedule' | 'workflow_dispatch';
}

export interface Action {
  id: string;
  name: string;
  scriptContent: string;
  schedule: Schedule;
  status: 'active' | 'paused';
  envVars: Record<string, string>;
  timeoutMinutes: number;
  maxRetries: number;
  retryDelaySeconds: number;
  githubWorkflowId?: number;
  cronJobId?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Plan {
  id: number;
  name: string;
  maxActions: number;
  maxRunsPerMonth: number;
  logRetentionDays: number;
  stripePriceId: string | null;
  priceCents: number;
}

export interface UserPlan {
  userId: string;
  planId: number;
  planName: string;
  billingCycleStart: string;
  stripeCustomerId: string | null;
}

export interface UsageStats {
  planName: string;
  actions: { used: number; limit: number };
  runs: { used: number; limit: number };
  billingCycleReset: string;
  logRetentionDays: number;
}
