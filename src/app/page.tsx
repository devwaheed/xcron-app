import Link from "next/link";
import NavAuth from "@/components/NavAuth";
import { Logo } from "@/components/Logo";
import ScrollReveal from "@/components/ScrollReveal";
import {
  CalendarIcon,
  BoltIcon,
  ChartIcon,
  PauseIcon,
  CodeIcon,
  ShieldIcon,
} from "@/components/icons";

const PLANS = [
  {
    id: 1,
    name: "Starter",
    description: "Perfect for side projects and trying things out.",
    price: "$49",
    features: [
      "5 scheduled actions",
      "100 runs per month",
      "30-day log retention",
      "Community support",
    ],
  },
  {
    id: 2,
    name: "Pro",
    description: "For developers who automate every day.",
    price: "$99",
    popular: true,
    features: [
      "15 scheduled actions",
      "500 runs per month",
      "90-day log retention",
      "Priority support",
    ],
  },
  {
    id: 3,
    name: "Business",
    description: "For teams running production workloads at scale.",
    price: "$199",
    features: [
      "50 scheduled actions",
      "2,000 runs per month",
      "1-year log retention",
      "Dedicated support",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo showWordmark />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-slate-500 transition-colors hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-500 transition-colors hover:text-slate-900">How it works</a>
            <a href="#pricing" className="text-sm text-slate-500 transition-colors hover:text-slate-900">Pricing</a>
            <Link href="/docs" className="text-sm text-slate-500 transition-colors hover:text-slate-900">Docs</Link>
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

        <ScrollReveal>
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
        </ScrollReveal>

        {/* Dashboard preview mockup */}
        <ScrollReveal delay={200}>
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
        </ScrollReveal>
      </section>

      {/* Stats Section */}
      <section id="stats" className="border-y border-slate-100 bg-slate-50/50">
        <ScrollReveal>
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
        </ScrollReveal>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <ScrollReveal>
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
        </ScrollReveal>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ScrollReveal className="h-full">
          <FeatureCard
            icon={<CalendarIcon size={20} />}
            title="Flexible Scheduling"
            description="Pick any combination of days, set a specific time and timezone. Your scripts run exactly when you need them."
            color="violet"
          />
          </ScrollReveal>
          <ScrollReveal delay={100} className="h-full">
          <FeatureCard
            icon={<BoltIcon size={20} />}
            title="Instant Execution"
            description="Need to run something right now? Trigger any action manually with a single click."
            color="amber"
          />
          </ScrollReveal>
          <ScrollReveal delay={200} className="h-full">
          <FeatureCard
            icon={<ChartIcon size={20} />}
            title="Run History & Logs"
            description="Monitor every execution with detailed logs. See what succeeded, what failed, and when."
            color="sky"
          />
          </ScrollReveal>
          <ScrollReveal className="h-full">
          <FeatureCard
            icon={<PauseIcon size={20} />}
            title="Pause & Resume"
            description="Temporarily stop any action without deleting it. Resume whenever you're ready."
            color="emerald"
          />
          </ScrollReveal>
          <ScrollReveal delay={100} className="h-full">
          <FeatureCard
            icon={<CodeIcon size={20} />}
            title="Script Management"
            description="Paste your code or upload a file. Edit scripts anytime — updates take effect on the next run."
            color="rose"
          />
          </ScrollReveal>
          <ScrollReveal delay={200} className="h-full">
          <FeatureCard
            icon={<ShieldIcon size={20} />}
            title="Secure by Default"
            description="Protected behind authentication. Only you control what runs and when."
            color="indigo"
          />
          </ScrollReveal>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-slate-100 bg-slate-50/50 px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Three steps to automation
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              From zero to scheduled in under a minute.
            </p>
          </div>
          </ScrollReveal>

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
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 100} className="h-full">
              <div className="group relative h-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} text-sm font-bold text-white`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.description}</p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative px-6 py-24 lg:py-32">
        {/* Subtle ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-100/50 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Simple pricing, no surprises
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                One-time payment. Pick a plan, start automating, own it forever.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid items-start gap-8 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <ScrollReveal key={plan.id} delay={i * 100} className="h-full">
                {plan.popular ? (
                  /* ── Highlighted Pro card with gradient glow ── */
                  <div className="relative flex h-full flex-col lg:-mt-4 lg:mb-0">
                    {/* Gradient glow behind card */}
                    <div className="absolute -inset-[2px] rounded-[18px] bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 opacity-75 blur-lg" />
                    {/* Gradient ring */}
                    <div className="absolute -inset-[2px] rounded-[18px] bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500" />
                    <div className="relative flex h-full flex-col rounded-2xl bg-white p-8">
                      <div className="mb-6 inline-flex self-start rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                        Most Popular
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                      <p className="mt-6 flex items-baseline">
                        <span className="text-5xl font-extrabold tracking-tight text-slate-900">{plan.price}</span>
                        <span className="ml-2 text-sm text-slate-500">one-time</span>
                      </p>
                      <ul className="mt-8 flex-1 divide-y divide-slate-100">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-3 py-3 first:pt-0">
                            <svg className="h-5 w-5 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-slate-600">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/login"
                        className="mt-8 flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/25 hover:brightness-110">
                        Get started
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* ── Standard card ── */
                  <div className="relative flex h-full flex-col rounded-2xl bg-white p-8 ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-slate-300">
                    <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                    <p className="mt-6 flex items-baseline">
                      <span className="text-5xl font-extrabold tracking-tight text-slate-900">{plan.price}</span>
                      <span className="ml-2 text-sm text-slate-500">one-time</span>
                    </p>
                    <ul className="mt-8 flex-1 divide-y divide-slate-100">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-3 py-3 first:pt-0">
                          <svg className="h-5 w-5 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-slate-600">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/login"
                      className="mt-8 flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:ring-slate-300">
                      Get started
                    </Link>
                  </div>
                )}
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={350}>
            <p className="mt-10 text-center text-sm text-slate-400">
              All plans include encrypted execution, GitHub-backed infrastructure, and automatic retries. Have a promo code? Enter it during signup.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t border-slate-100 bg-slate-50/50 px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Frequently asked questions</h2>
              <p className="mt-4 text-lg text-slate-500">Quick answers to common questions.</p>
            </div>
          </ScrollReveal>
          <div className="mt-12 space-y-6">
            {[
              { q: "What kind of scripts can I run?", a: "Any JavaScript that Node.js can execute — HTTP requests, data processing, web scraping, API integrations, database operations, and more." },
              { q: "Do I need to manage any servers?", a: "No. Your scripts run on GitHub Actions infrastructure. xCron handles all the orchestration — you just write the code." },
              { q: "How reliable is the scheduling?", a: "We use dual scheduling with GitHub Actions cron and cron-job.org for redundancy. If one system has a delay, the other ensures your job runs." },
              { q: "Can I self-host xCron?", a: "Yes. xCron is fully self-hostable. You'll need Supabase, a GitHub repo, and optionally cron-job.org. See our docs for the full setup guide." },
              { q: "What happens if my script fails?", a: "Failed runs are logged with full error output. You can view them in your run history and optionally receive email alerts." },
              { q: "Is there a free tier?", a: "The Starter plan gives you 5 jobs and 100 runs per month — enough to try things out and automate your side projects." },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 50}>
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <h3 className="text-base font-semibold text-slate-900">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 lg:py-32">
        <ScrollReveal>
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
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Logo />
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#features" className="transition-colors hover:text-slate-600">Features</a>
              <a href="#how-it-works" className="transition-colors hover:text-slate-600">How it works</a>
              <a href="#pricing" className="transition-colors hover:text-slate-600">Pricing</a>
              <Link href="/docs" className="transition-colors hover:text-slate-600">Docs</Link>
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
    <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
