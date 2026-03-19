import type { Schedule } from '@/types';

const CRONJOB_API = 'https://api.cron-job.org';

interface CronJobSchedule {
  timezone: string;
  hours: number[];
  minutes: number[];
  mdays: number[];
  months: number[];
  wdays: number[];
  expiresAt: number;
}

function to24Hour(hour: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

/**
 * Convert our app Schedule to cron-job.org's native schedule format.
 * cron-job.org handles timezone conversion itself, so we pass local time directly.
 */
function toCronJobSchedule(schedule: Schedule): CronJobSchedule {
  const hour24 = to24Hour(schedule.hour, schedule.period);
  return {
    timezone: schedule.timezone,
    hours: [hour24],
    minutes: [schedule.minute],
    mdays: [-1],       // every day of month
    months: [-1],      // every month
    wdays: schedule.days, // 0=Sun matches cron-job.org's format
    expiresAt: 0,
  };
}

function getHeaders(): Record<string, string> {
  const apiKey = process.env.CRONJOB_API_KEY;
  if (!apiKey) throw new Error('CRONJOB_API_KEY environment variable is not set');
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export interface CronJobBridge {
  createJob(actionId: string, actionName: string, schedule: Schedule, enabled: boolean, userId: string): Promise<number>;
  updateJob(cronJobId: number, actionId: string, actionName: string, schedule: Schedule): Promise<void>;
  deleteJob(cronJobId: number): Promise<void>;
  enableJob(cronJobId: number): Promise<void>;
  disableJob(cronJobId: number): Promise<void>;
}

export function createCronJobBridge(): CronJobBridge {
  // The trigger URL is our app's per-action trigger endpoint
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');

  const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
  const cronSecret = process.env.CRON_SECRET;

  return {
    async createJob(actionId, actionName, schedule, enabled, userId) {
      const triggerUrl = `${baseUrl}/api/actions/${actionId}/trigger`;
      const shortUserId = userId.substring(0, 8);
      const body = {
        job: {
          url: triggerUrl,
          title: `${actionName} [${shortUserId}]`,
          enabled,
          saveResponses: true,
          schedule: toCronJobSchedule(schedule),
          requestMethod: 1, // POST
          extendedData: {
            headers: cronSecret
              ? { 'Authorization': `Bearer ${cronSecret}`, 'Content-Type': 'application/json' }
              : { 'Content-Type': 'application/json' },
            body: '',
          },
          notification: {
            onFailure: true,
            onSuccess: false,
            onDisable: true,
          },
        },
      };

      const res = await fetch(`${CRONJOB_API}/jobs`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`cron-job.org create failed: ${res.status} - ${detail}`);
      }

      const data = await res.json();
      return data.jobId as number;
    },

    async updateJob(cronJobId, actionId, actionName, schedule) {
      const triggerUrl = `${baseUrl}/api/actions/${actionId}/trigger`;
      const body = {
        job: {
          url: triggerUrl,
          title: actionName,
          schedule: toCronJobSchedule(schedule),
        },
      };

      const res = await fetch(`${CRONJOB_API}/jobs/${cronJobId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`cron-job.org update failed: ${res.status} - ${detail}`);
      }
    },

    async deleteJob(cronJobId) {
      const res = await fetch(`${CRONJOB_API}/jobs/${cronJobId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`cron-job.org delete failed: ${res.status} - ${detail}`);
      }
    },

    async enableJob(cronJobId) {
      const res = await fetch(`${CRONJOB_API}/jobs/${cronJobId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ job: { enabled: true } }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`cron-job.org enable failed: ${res.status} - ${detail}`);
      }
    },

    async disableJob(cronJobId) {
      const res = await fetch(`${CRONJOB_API}/jobs/${cronJobId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ job: { enabled: false } }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`cron-job.org disable failed: ${res.status} - ${detail}`);
      }
    },
  };
}
