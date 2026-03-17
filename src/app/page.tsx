import Link from "next/link";
import NavAuth from "@/components/NavAuth";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">xCron</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-slate-500 transition-colors hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-500 transition-colors hover:text-slate-900">How it works</a>
            <a href="#stats" className="text-sm text-slate-500 transition-colors hover:text-slate-900">Why xCron</a>
          </div>

          <div className="flex items-center gap-3">
            <NavAuth />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 lg:pt-32 lg:pb-24">
        {/* Soft gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-violet-100/60 blur-[80px]" />
          <div className="absolute -bottom-20 -left-32 h-[400px] w-[400px] rounded-full bg-indigo-100/50 blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-100/40 blur-[60px]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm text-violet-700">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Automate anything with scheduled scripts
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Your scripts,{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
              running on schedule
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl">
            Schedule JavaScript to run on your terms. Pick the days, set the time, and let your automations handle the rest. No servers, no complexity.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-full bg-slate-900 px-8 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/15"
            >
              Start automating
              <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-full border border-slate-200 bg-white px-8 text-base font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="relative mx-auto mt-20 max-w-5xl">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-violet-200/40 via-indigo-200/40 to-sky-200/40 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-200/50">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-slate-400">xcron-app.vercel.app/dashboard</span>
            </div>
            <div className="bg-slate-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">Your Actions</div>
                <div className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white">+ New Action</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: "Health Check", days: "M W F", time: "9:00 AM", status: "active" },
                  { name: "DB Backup", days: "Daily", time: "2:00 AM", status: "active" },
                  { name: "Report Gen", days: "Mon", time: "8:00 AM", status: "paused" },
                ].map((item) => (
                  <div key={item.name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{item.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">{item.days} · {item.time}</div>
                    <div className="mt-3 flex gap-2">
                      <div className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">Run Now</div>
                      <div className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">Edit</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="border-y border-slate-100 bg-slate-50/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4">
          {[
            { value: "Zero", label: "Servers to manage" },
            { value: "24/7", label: "Automated execution" },
            { value: "99.9%", label: "Uptime reliability" },
            { value: "<1min", label: "Setup time" },
          ].map((stat) => (
            <div key={stat.label} className="px-6 py-12 text-center sm:py-16">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              ship automation
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            A complete toolkit for scheduling, monitoring, and managing your scripts.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<CalendarIcon />}
            title="Flexible Scheduling"
            description="Pick any combination of days, set a specific time and timezone. Your scripts run exactly when you need them."
            color="violet"
          />
          <FeatureCard
            icon={<BoltIcon />}
            title="Instant Execution"
            description="Need to run something right now? Trigger any action manually with a single click."
            color="amber"
          />
          <FeatureCard
            icon={<ChartIcon />}
            title="Run History & Logs"
            description="Monitor every execution with detailed logs. See what succeeded, what failed, and when."
            color="sky"
          />
          <FeatureCard
            icon={<PauseIcon />}
            title="Pause & Resume"
            description="Temporarily stop any action without deleting it. Resume whenever you're ready."
            color="emerald"
          />
          <FeatureCard
            icon={<CodeIcon />}
            title="Script Management"
            description="Paste your code or upload a file. Edit scripts anytime — updates take effect on the next run."
            color="rose"
          />
          <FeatureCard
            icon={<ShieldIcon />}
            title="Secure by Default"
            description="Protected behind authentication. Only you control what runs and when."
            color="indigo"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-slate-100 bg-slate-50/50 px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Three steps to automation
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              From zero to scheduled in under a minute.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Write your script",
                description: "Paste JavaScript or upload a .js file. Anything Node.js can run — HTTP calls, scraping, data processing.",
                gradient: "from-violet-500 to-indigo-500",
              },
              {
                step: "02",
                title: "Set your schedule",
                description: "Pick the days, choose a time, select your timezone. We generate the cron expression for you.",
                gradient: "from-indigo-500 to-sky-500",
              },
              {
                step: "03",
                title: "Let it run",
                description: "Your script runs automatically on schedule. Monitor every execution and get notified of failures.",
                gradient: "from-sky-500 to-emerald-500",
              },
            ].map((item) => (
              <div key={item.step} className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} text-sm font-bold text-white`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 px-8 py-16 sm:px-16 sm:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to automate?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-white/70">
                Set up your first scheduled action in under a minute. No credit card required.
              </p>
              <div className="mt-8">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-full bg-white px-8 text-base font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl"
                >
                  Get started free
                  <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-400">xCron</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#features" className="transition-colors hover:text-slate-600">Features</a>
              <a href="#how-it-works" className="transition-colors hover:text-slate-600">How it works</a>
              <Link href="/login" className="transition-colors hover:text-slate-600">Sign in</Link>
            </div>
            <div className="text-sm text-slate-300">
              © {new Date().getFullYear()} xCron. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const colorMap: Record<string, { bg: string; text: string }> = {
  violet: { bg: "bg-violet-50", text: "text-violet-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  sky: { bg: "bg-sky-50", text: "text-sky-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
};

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const c = colorMap[color] ?? colorMap.violet;
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
