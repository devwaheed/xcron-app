import Link from "next/link";
import { Logo } from "@/components/Logo";
import NavAuth from "@/components/NavAuth";

const SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: [
      { q: "What is xCron?", a: "xCron is a scheduled job platform that lets you write JavaScript scripts and run them automatically on a schedule. Your scripts execute via GitHub Actions, with scheduling powered by cron-job.org for reliability." },
      { q: "How do I create my first job?", a: "Sign up, go to your dashboard, and click \"New Job\". Give it a name, paste your JavaScript code, pick the days and time you want it to run, and hit Create. That's it — your script will run on schedule." },
      { q: "What can I automate?", a: "Anything Node.js can do: HTTP health checks, API calls, data processing, sending notifications, database maintenance, web scraping, report generation, and more." },
    ],
  },
  {
    id: "scripts",
    title: "Writing Scripts",
    content: [
      { q: "What language do scripts use?", a: "JavaScript (Node.js). Your script runs in a GitHub Actions environment with full Node.js support. You can use fetch(), async/await, and any built-in Node.js modules." },
      { q: "Can I use npm packages?", a: "The default environment includes Node.js built-ins. For external packages, you can use dynamic imports or include the package code directly in your script." },
      { q: "Are there any restrictions?", a: "For security, scripts cannot use eval(), the Function constructor, child_process, or reference server secrets. Scripts are limited to 50KB. These restrictions protect the platform and other users." },
      { q: "How do I handle errors?", a: "Use try/catch blocks in your script. If your script throws an unhandled error, the run will be marked as failed and you'll see the error in your run history." },
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling",
    content: [
      { q: "How does scheduling work?", a: "Pick any combination of days (Monday through Sunday), set a time, and choose your timezone. xCron generates the cron expression and sets up both GitHub Actions and cron-job.org for reliable execution." },
      { q: "What timezones are supported?", a: "All IANA timezones are supported. Your profile timezone is used as the default, but each job can have its own timezone." },
      { q: "Can I run a job manually?", a: "Yes. Every job card has a \"Run Now\" button that triggers immediate execution via GitHub workflow dispatch." },
      { q: "How reliable is the scheduling?", a: "We use dual scheduling — GitHub Actions cron and cron-job.org — for redundancy. If one system has a delay, the other ensures your job runs on time." },
    ],
  },
  {
    id: "plans",
    title: "Plans & Limits",
    content: [
      { q: "What are the plan limits?", a: "Starter: 5 jobs, 100 runs/month. Pro: 15 jobs, 500 runs/month. Business: 50 jobs, 2,000 runs/month. Each tier also includes different log retention periods." },
      { q: "What happens when I hit a limit?", a: "You'll see a warning in your dashboard. You won't be able to create new jobs or trigger runs beyond your limit. Upgrade your plan or wait for the monthly reset." },
      { q: "How do promo codes work?", a: "Enter a promo code during signup or in the Billing & Usage section of your dashboard. Valid codes instantly upgrade your plan." },
    ],
  },
  {
    id: "self-hosting",
    title: "Self-Hosting",
    content: [
      { q: "Can I self-host xCron?", a: "Yes. xCron is designed to be self-hostable. You'll need a Supabase project, a GitHub repository for script storage, and optionally a cron-job.org account for reliable scheduling." },
      { q: "What do I need to set up?", a: "1) Clone the repo. 2) Create a Supabase project and run the migrations. 3) Create a GitHub repo for scripts. 4) Set up your environment variables. 5) Deploy to Vercel or any Node.js host." },
      { q: "What environment variables are required?", a: "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_PAT, CRONJOB_API_KEY, and CRON_SECRET. Optional: RESEND_API_KEY for emails, STRIPE keys for payments." },
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
        <h1 className="text-3xl font-bold text-slate-900">Documentation</h1>
        <p className="mt-3 text-lg text-slate-500">Everything you need to know about xCron.</p>

        {/* Table of contents */}
        <nav className="mt-10 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">On this page</h2>
          <ul className="space-y-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-violet-600 hover:text-violet-800">{s.title}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
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
