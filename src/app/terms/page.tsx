import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5"><Logo showWordmark /></Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">Home</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: April 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-600">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">1. Acceptance of Terms</h2>
            <p>By accessing or using xCron ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">2. Description of Service</h2>
            <p>xCron is a scheduled job platform that allows users to create, schedule, and execute JavaScript scripts via GitHub Actions. The Service includes a web dashboard, API endpoints, and integration with third-party services (GitHub, cron-job.org, Supabase).</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">3. User Accounts</h2>
            <p>You must provide a valid email address and password to create an account. You are responsible for maintaining the security of your account credentials. You must not share your account with others or allow unauthorized access.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Execute malicious code, malware, or scripts designed to harm third parties</li>
              <li>Perform unauthorized access to external systems or networks</li>
              <li>Send spam, phishing, or unsolicited communications</li>
              <li>Mine cryptocurrency or perform computationally abusive tasks</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Circumvent usage limits or rate restrictions</li>
            </ul>
            <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these terms without notice.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">5. Usage Limits</h2>
            <p>Each plan has defined limits on the number of jobs, monthly runs, and log retention. Exceeding these limits may result in restricted functionality until the next billing cycle or plan upgrade.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">6. Script Content</h2>
            <p>You retain ownership of all scripts you create. By uploading scripts to the Service, you grant xCron a limited license to store, execute, and display your scripts solely for the purpose of providing the Service. Scripts are stored in a GitHub repository and executed via GitHub Actions.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">7. Third-Party Services</h2>
            <p>The Service relies on third-party infrastructure including GitHub, Supabase, and cron-job.org. We are not responsible for outages, data loss, or service interruptions caused by these providers.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">8. Limitation of Liability</h2>
            <p>The Service is provided "as is" without warranties of any kind. xCron shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to loss of data, revenue, or business opportunities.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">9. Termination</h2>
            <p>You may delete your account at any time. We may suspend or terminate your access if you violate these terms. Upon termination, your scripts and data will be deleted within 30 days.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">10. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">11. Contact</h2>
            <p>For questions about these terms, contact us at the email address associated with your xCron account administration.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
