import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5"><Logo showWordmark /></Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">Home</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: April 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-600">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">1. Information We Collect</h2>
            <p><strong>Account information:</strong> Email address and password (hashed) when you create an account.</p>
            <p className="mt-2"><strong>Profile information:</strong> Display name and timezone preference, provided voluntarily.</p>
            <p className="mt-2"><strong>Script content:</strong> JavaScript code you create and upload for scheduled execution.</p>
            <p className="mt-2"><strong>Usage data:</strong> Job execution logs (success/failure status, timestamps, output), usage counts, and plan information.</p>
            <p className="mt-2"><strong>Technical data:</strong> IP address (for rate limiting only, not stored long-term), browser type, and access timestamps in server logs.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and operate the Service (execute your scheduled scripts)</li>
              <li>To authenticate your identity and secure your account</li>
              <li>To enforce usage limits and plan restrictions</li>
              <li>To send transactional emails (welcome, password reset, job failure alerts)</li>
              <li>To monitor system health and prevent abuse</li>
            </ul>
            <p className="mt-2">We do not sell your personal information. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">3. Data Storage</h2>
            <p><strong>Database:</strong> Account and job metadata is stored in Supabase (PostgreSQL), hosted on AWS infrastructure.</p>
            <p className="mt-2"><strong>Scripts:</strong> Your script files and workflow configurations are stored in a private GitHub repository.</p>
            <p className="mt-2"><strong>Execution logs:</strong> Run history is fetched from GitHub Actions and not permanently stored by xCron beyond your plan's retention period.</p>
            <p className="mt-2"><strong>Environment variables:</strong> Stored as JSON in the database. We recommend not storing highly sensitive secrets — use GitHub Secrets or external vaults for production credentials.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">4. Third-Party Services</h2>
            <p>We use the following third-party services to operate xCron:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li><strong>Supabase</strong> — Authentication and database</li>
              <li><strong>GitHub</strong> — Script storage and execution via GitHub Actions</li>
              <li><strong>cron-job.org</strong> — Reliable schedule triggering</li>
              <li><strong>Resend</strong> — Transactional email delivery (when configured)</li>
              <li><strong>Vercel</strong> — Application hosting</li>
            </ul>
            <p className="mt-2">Each provider has their own privacy policy. We encourage you to review them.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">5. Data Retention</h2>
            <p>Account data is retained as long as your account is active. Execution logs are retained according to your plan's retention period (30 days to 1 year). Upon account deletion, all associated data (profile, jobs, scripts, logs) will be removed within 30 days.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">6. Security</h2>
            <p>We implement reasonable security measures including:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Passwords are hashed (never stored in plain text)</li>
              <li>Authentication tokens are stored in HTTP-only, secure cookies</li>
              <li>Row-level security (RLS) ensures users can only access their own data</li>
              <li>Rate limiting on authentication and API endpoints</li>
              <li>Script content validation before execution</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">7. Your Rights</h2>
            <p>You may:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Access and update your profile information at any time</li>
              <li>Export your scripts and job configurations</li>
              <li>Delete your account and all associated data</li>
              <li>Request information about what data we hold about you</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">8. Cookies</h2>
            <p>We use essential cookies only — authentication session tokens. We do not use tracking cookies, analytics cookies, or advertising cookies.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">9. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify users of significant changes via email or dashboard notification.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">10. Contact</h2>
            <p>For privacy-related questions or data requests, contact us at the email address associated with your xCron account administration.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
