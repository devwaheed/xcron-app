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
    description: "For individuals automating a few tasks.",
    price: "$49",
    features: [
      "5 scheduled jobs",
      "100 runs per month",
      "30-day history",
      "Email alerts",
    ],
  },
  {
    id: 2,
    name: "Pro",
    description: "For professionals who rely on automation daily.",
    price: "$99",
    popular: true,
    features: [
      "15 scheduled jobs",
      "500 runs per month",
      "90-day history",
      "Priority support",
    ],
  },
  {
    id: 3,
    name: "Business",
    description: "For teams running critical automations at scale.",
    price: "$199",
    features: [
      "50 scheduled jobs",
      "2,000 runs per month",
      "1-year history",
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
            Automate any task — no servers, no complexity
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Put your tasks{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
              on autopilot
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl">
            Schedule HTTP requests, monitor websites, send reports, and automate workflows. Pick a time, set it, forget it. No coding required — or bring your own scripts.
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
              automate your work
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            From simple URL pings to complex workflows — set it up once, let it run forever.
          </p>
        </div>
        </ScrollReveal>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ScrollReveal className="h-full">
          <FeatureCard
            icon={<CalendarIcon size={20} />}
            title="Schedule Anything"
            description="Pick the days, choose a time, select your timezone. Your jobs run exactly when you need them — every day, weekdays only, or custom."
            color="violet"
          />
          </ScrollReveal>
          <ScrollReveal delay={100} className="h-full">
          <FeatureCard
            icon={<BoltIcon size={20} />}
            title="No-Code HTTP Requests"
            description="Just paste a URL and pick a schedule. Monitor websites, trigger webhooks, call APIs — no coding needed."
            color="amber"
          />
          </ScrollReveal>
          <ScrollReveal delay={200} className="h-full">
          <FeatureCard
            icon={<ChartIcon size={20} />}
            title="See What Happened"
            description="Every run is logged with status, timing, and output. Know instantly when something fails — and get email alerts."
            color="sky"
          />
          </ScrollReveal>
          <ScrollReveal className="h-full">
          <FeatureCard
            icon={<PauseIcon size={20} />}
            title="Pause & Resume"
            description="Going on vacation? Pause any job with one click. Resume when you're back — no reconfiguration needed."
            color="emerald"
          />
          </ScrollReveal>
          <ScrollReveal delay={100} className="h-full">
          <FeatureCard
            icon={<CodeIcon size={20} />}
            title="Custom Scripts"
            description="Need more power? Write JavaScript for complex automations — data processing, multi-step workflows, anything."
            color="rose"
          />
          </ScrollReveal>
          <ScrollReveal delay={200} className="h-full">
          <FeatureCard
            icon={<ShieldIcon size={20} />}
            title="Reliable & Secure"
            description="Auto-retries on failure, configurable timeouts, and encrypted credentials. Your automations run even when you're asleep."
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
                title: "Choose what to automate",
                description: "Paste a URL to call on schedule, or write a custom script. Monitor a website, trigger a webhook, send a report — anything goes.",
                gradient: "from-violet-500 to-indigo-500",
              },
              {
                step: "02",
                title: "Set your schedule",
                description: "Pick the days and time. Every weekday at 9am? Sundays at midnight? Your timezone, your rules.",
                gradient: "from-indigo-500 to-sky-500",
              },
              {
                step: "03",
                title: "Sit back and relax",
                description: "Your jobs run automatically. Get notified when something fails. Check your dashboard anytime to see what happened.",
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

      {/* Social Proof */}
      <section className="border-t border-slate-100 bg-white px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">Trusted by teams worldwide</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">People love automating with xCron</h2>
            </div>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Sarah K.", role: "E-commerce Manager", quote: "I set up uptime monitoring for our Shopify store in 2 minutes. No code, just pasted the URL and picked a schedule. It's been running flawlessly for months." },
              { name: "Marcus T.", role: "Freelance Developer", quote: "I used to manage cron jobs on a VPS. xCron replaced all of that — scheduled API calls, database cleanups, report generation. Saves me hours every week." },
              { name: "Priya R.", role: "Marketing Lead", quote: "We use it to trigger our analytics pipeline every morning. The failure alerts caught a broken API endpoint before our team even noticed." },
            ].map((t, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex gap-1">
                    {[0,1,2,3,4].map(s => (
                      <svg key={s} className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-xs font-bold text-white">
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
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
              { q: "Do I need to know how to code?", a: "No. You can schedule HTTP requests (call any URL on a timer) without writing a single line of code. For advanced use cases, you can write custom JavaScript." },
              { q: "What can I automate?", a: "Website monitoring, webhook triggers, API calls, report generation, data backups, Slack/Discord notifications, email reminders — anything that can be triggered by an HTTP request or a script." },
              { q: "How reliable is it?", a: "Very. Jobs run on enterprise-grade cloud infrastructure with automatic retries on failure. You get email alerts if something goes wrong." },
              { q: "Can I try it before buying?", a: "The Starter plan gives you 5 jobs and 100 runs per month — enough to automate your most important tasks and see the value." },
              { q: "What happens if my job fails?", a: "You'll get an email alert with the error details. Failed runs are logged so you can diagnose and fix the issue. Auto-retry is available for transient failures." },
              { q: "Is my data secure?", a: "Yes. All accounts are isolated with row-level security. Credentials are encrypted. Authentication uses industry-standard protocols." },
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
                Set up your first scheduled job in under a minute. No credit card, no servers, no complexity.
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
              <Link href="/terms" className="transition-colors hover:text-slate-600">Terms</Link>
              <Link href="/privacy" className="transition-colors hover:text-slate-600">Privacy</Link>
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
