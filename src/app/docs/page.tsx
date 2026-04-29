import Link from "next/link";
import { Logo } from "@/components/Logo";
import NavAuth from "@/components/NavAuth";

const SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: [
      { q: "What is xCron?", a: "xCron is a scheduled automation platform. Create jobs that run on a timer — call URLs, monitor websites, trigger webhooks, or run custom scripts. Everything runs in the cloud, fully managed." },
      { q: "How do I create my first job?", a: "Sign up, go to your dashboard, and click \"New Job\". Choose HTTP Request (no code) or Custom Script, set your schedule, and hit Create. Your job will start running automatically." },
      { q: "What can I automate?", a: "Website uptime monitoring, API health checks, webhook triggers, report generation, data backups, Slack/Discord notifications, email reminders, and any custom workflow you can think of." },
      { q: "Do I need to know how to code?", a: "No. The HTTP Request mode lets you schedule URL calls without any coding. Just paste a URL, pick a method (GET, POST, etc.), and set your schedule. For advanced use cases, you can write JavaScript." },
    ],
  },
  {
    id: "http-requests",
    title: "HTTP Request Jobs",
    content: [
      { q: "How do HTTP request jobs work?", a: "You provide a URL, choose an HTTP method (GET, POST, PUT, etc.), and optionally add headers and a request body. xCron calls that URL on your schedule and logs the response." },
      { q: "Can I add authentication headers?", a: "Yes. Add any custom headers like Authorization, API keys, or Bearer tokens. Headers are stored securely and sent with every request." },
      { q: "What if the request fails?", a: "Failed requests (non-2xx responses) are logged with the full response. You can configure automatic retries (1-3 attempts) and get email alerts on failure." },
      { q: "Can I send POST data?", a: "Yes. For POST, PUT, and PATCH requests, you can include a request body (JSON, form data, or plain text). Add a Content-Type header to match your payload." },
    ],
  },
  {
    id: "scripts",
    title: "Custom Scripts",
    content: [
      { q: "What language do scripts use?", a: "JavaScript. Your scripts run in a secure cloud environment with full Node.js support. You can use fetch(), async/await, and built-in modules." },
      { q: "Are there any restrictions?", a: "For security, scripts cannot access the host system or reference platform credentials. Scripts are limited to 50KB. These restrictions protect all users on the platform." },
      { q: "How do I handle errors?", a: "Use try/catch blocks. If your script throws an unhandled error, the run is marked as failed and you'll see the error in your run history." },
      { q: "Can I use environment variables?", a: "Yes. Each job can have up to 20 key-value environment variables. They're injected at runtime — great for API keys, config values, and secrets." },
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling",
    content: [
      { q: "How does scheduling work?", a: "Pick any combination of days (Monday through Sunday), set a time, and choose your timezone. xCron handles the rest — your job runs automatically at the specified time." },
      { q: "What timezones are supported?", a: "All major timezones worldwide. Your profile timezone is used as the default, but each job can have its own timezone." },
      { q: "Can I run a job manually?", a: "Yes. Every job has a \"Run Now\" button for immediate execution, regardless of the schedule." },
    ],
  },
  {
    id: "plans",
    title: "Plans & Billing",
    content: [
      { q: "What are the plan limits?", a: "Starter: 5 jobs, 100 runs/month. Pro: 15 jobs, 500 runs/month. Business: 50 jobs, 2,000 runs/month. Each tier includes different history retention periods." },
      { q: "What happens when I hit a limit?", a: "You'll see a warning in your dashboard. You won't be able to create new jobs or trigger runs beyond your limit. Upgrade your plan or wait for the monthly reset." },
      { q: "How do promo codes work?", a: "Enter a promo code during signup or in the Billing & Usage section. Valid codes instantly upgrade your plan." },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5"><Logo showWordmark /></Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">Home</Link>
            <Link href="/pricing" className="text-sm text-slate-500 hover:text-slate-900">Pricing</Link>
            <NavAuth />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900">Help Center</h1>
        <p className="mt-3 text-lg text-slate-500">Everything you need to get the most out of xCron.</p>

        <nav className="mt-10 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Topics</h2>
          <ul className="space-y-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-violet-600 hover:text-violet-800">{s.title}</a>
              </li>
            ))}
          </ul>
        </nav>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
            <div className="mt-6 space-y-8">
              {section.content.map((item) => (
                <div key={item.q}>
                  <h3 className="text-base font-semibold text-slate-800">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} xCron. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
