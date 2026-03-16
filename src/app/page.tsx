import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Automate your tasks,{" "}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            effortlessly
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
          Schedule scripts to run on your terms. Pick the days, set the time,
          and let your actions execute automatically — no manual work required.
        </p>
        <Link
          href="/login"
          className="mt-10 inline-flex h-12 items-center rounded-full bg-purple-600 px-8 text-base font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 hover:shadow-purple-500/40"
        >
          Get Started
        </Link>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="📅"
            title="Flexible Scheduling"
            description="Choose any combination of days, set a specific time and timezone. Your actions run exactly when you need them."
          />
          <FeatureCard
            icon="⚡"
            title="Instant Execution"
            description="Need to run something right now? Trigger any action manually with a single click, no waiting required."
          />
          <FeatureCard
            icon="📊"
            title="Run History"
            description="Monitor every execution with detailed logs. See what succeeded, what failed, and when it happened."
          />
          <FeatureCard
            icon="⏸️"
            title="Pause &amp; Resume"
            description="Temporarily stop any action without deleting it. Resume whenever you're ready — your configuration stays intact."
          />
          <FeatureCard
            icon="✏️"
            title="Easy Script Management"
            description="Paste your code or upload a file. Edit scripts anytime and updates take effect on the next scheduled run."
          />
          <FeatureCard
            icon="🔒"
            title="Secure by Design"
            description="Your scripts and configurations are protected behind authentication. Only you control what runs and when."
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-24 text-center">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
          <h3 className="text-2xl font-bold">Ready to automate?</h3>
          <p className="mt-3 text-slate-300">
            Set up your first scheduled action in minutes.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-purple-600 px-8 text-base font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 hover:shadow-purple-500/40"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-colors hover:bg-white/10">
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}
