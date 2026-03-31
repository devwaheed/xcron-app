"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const TEMPLATES = [
  {
    id: "health-check",
    name: "Health Check Ping",
    category: "Monitoring",
    description: "Ping an endpoint to verify it's up and responding.",
    script: `const url = "https://example.com/health";\nconst res = await fetch(url);\nif (!res.ok) throw new Error(\`HTTP \${res.status}\`);\nconsole.log("✓ Health check passed");`,
    days: [1,2,3,4,5], hour: 9, minute: 0, period: "AM" as const,
  },
  {
    id: "api-fetch",
    name: "Daily API Fetch",
    category: "Data",
    description: "Fetch data from an API and log the results.",
    script: `const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");\nconst data = await res.json();\nconsole.log(JSON.stringify(data, null, 2));`,
    days: [0,1,2,3,4,5,6], hour: 7, minute: 0, period: "AM" as const,
  },
  {
    id: "slack-notify",
    name: "Slack Notification",
    category: "Notifications",
    description: "Send a daily message to a Slack channel via webhook.",
    script: `const webhook = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL";\nawait fetch(webhook, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ text: "Daily update ✅" }),\n});`,
    days: [1,2,3,4,5], hour: 9, minute: 0, period: "AM" as const,
  },
  {
    id: "ssl-check",
    name: "SSL Certificate Check",
    category: "Monitoring",
    description: "Check if an SSL certificate is expiring soon.",
    script: `const domain = "example.com";\nconst res = await fetch(\`https://\${domain}\`);\nconsole.log(\`✓ \${domain} SSL is valid, status: \${res.status}\`);`,
    days: [1], hour: 8, minute: 0, period: "AM" as const,
  },
  {
    id: "db-backup-log",
    name: "Database Backup Logger",
    category: "Backups",
    description: "Log a database backup event with timestamp.",
    script: `const ts = new Date().toISOString();\nconsole.log(\`Backup started at \${ts}\`);\n// Add your backup logic here\nconsole.log("Backup completed successfully");`,
    days: [0,1,2,3,4,5,6], hour: 2, minute: 0, period: "AM" as const,
  },
  {
    id: "uptime-monitor",
    name: "Uptime Monitor",
    category: "Monitoring",
    description: "Check multiple endpoints and report their status.",
    script: `const urls = [\n  "https://example.com",\n  "https://api.example.com/health",\n];\nfor (const url of urls) {\n  try {\n    const res = await fetch(url);\n    console.log(\`✓ \${url} — \${res.status}\`);\n  } catch (e) {\n    console.error(\`✗ \${url} — \${e.message}\`);\n  }\n}`,
    days: [0,1,2,3,4,5,6], hour: 6, minute: 0, period: "AM" as const,
  },
  {
    id: "rss-digest",
    name: "RSS Feed Digest",
    category: "Data",
    description: "Fetch an RSS feed and log the latest entries.",
    script: `const feedUrl = "https://hnrss.org/frontpage?count=5";\nconst res = await fetch(feedUrl);\nconst text = await res.text();\nconst titles = text.match(/<title>(.*?)<\\/title>/g) || [];\ntitles.slice(1).forEach(t => console.log(t.replace(/<\\/?title>/g, "")));`,
    days: [1,2,3,4,5], hour: 8, minute: 0, period: "AM" as const,
  },
  {
    id: "webhook-ping",
    name: "Webhook Ping",
    category: "Integrations",
    description: "Send a POST request to a webhook URL with custom data.",
    script: `const webhookUrl = "https://your-webhook-url.com";\nconst payload = { event: "scheduled_ping", timestamp: new Date().toISOString() };\nconst res = await fetch(webhookUrl, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(payload),\n});\nconsole.log(\`Webhook response: \${res.status}\`);`,
    days: [1,2,3,4,5], hour: 10, minute: 0, period: "AM" as const,
  },
  {
    id: "cleanup-script",
    name: "Data Cleanup",
    category: "Maintenance",
    description: "Run periodic cleanup tasks like purging old data.",
    script: `console.log("Starting cleanup...");\nconst cutoff = new Date();\ncutoff.setDate(cutoff.getDate() - 30);\nconsole.log(\`Would delete records older than \${cutoff.toISOString()}\`);\nconsole.log("Cleanup complete");`,
    days: [0], hour: 3, minute: 0, period: "AM" as const,
  },
  {
    id: "discord-notify",
    name: "Discord Notification",
    category: "Notifications",
    description: "Send a message to a Discord channel via webhook.",
    script: `const webhook = "https://discord.com/api/webhooks/YOUR/WEBHOOK";\nawait fetch(webhook, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ content: "📊 Daily automated report — all systems operational." }),\n});\nconsole.log("Discord notification sent");`,
    days: [1,2,3,4,5], hour: 9, minute: 30, period: "AM" as const,
  },
];

const CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))];

export default function TemplatesPage() {
  const router = useRouter();

  function useTemplate(template: typeof TEMPLATES[0]) {
    const params = new URLSearchParams({
      template: template.id,
      name: template.name,
    });
    router.push(`/dashboard/new?${params}`);
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Templates</h1>
          <p className="mt-1 text-sm text-slate-500">Start with a pre-built template and customize it.</p>
        </div>
        <Link href="/dashboard/new"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
          Blank Job
        </Link>
      </div>

      {CATEGORIES.map((category) => (
        <div key={category} className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">{category}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.filter((t) => t.category === category).map((template) => (
              <button key={template.id} onClick={() => useTemplate(template)}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-violet-300 hover:shadow-md">
                <h3 className="text-sm font-semibold text-slate-800 group-hover:text-violet-600">{template.name}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500">{template.description}</p>
                <span className="mt-3 text-xs font-medium text-violet-500">Use template →</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
