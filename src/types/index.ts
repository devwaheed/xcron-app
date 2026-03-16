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
  githubWorkflowId?: number;
  createdAt: string;
  updatedAt: string;
}
