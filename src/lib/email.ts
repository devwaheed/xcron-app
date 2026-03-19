import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "xCron <noreply@xcron.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function isEnabled(): boolean {
  return resend !== null;
}

export async function sendWelcomeEmail(email: string, name?: string) {
  if (!isEnabled()) return;
  const displayName = name || email.split("@")[0];
  await resend!.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to xCron",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px">
        <h1 style="font-size:24px;font-weight:600;color:#0f172a;margin-bottom:16px">Welcome to xCron, ${displayName}!</h1>
        <p style="font-size:15px;color:#475569;line-height:1.6;margin-bottom:24px">
          Your account is ready. You can now create scheduled jobs that run automatically — health checks, backups, reports, and more.
        </p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
          Go to Dashboard
        </a>
        <p style="font-size:13px;color:#94a3b8;margin-top:32px">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  if (!isEnabled()) return;
  await resend!.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your xCron password",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px">
        <h1 style="font-size:24px;font-weight:600;color:#0f172a;margin-bottom:16px">Reset your password</h1>
        <p style="font-size:15px;color:#475569;line-height:1.6;margin-bottom:24px">
          We received a request to reset your password. Click the button below to choose a new one.
        </p>
        <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
          Reset Password
        </a>
        <p style="font-size:13px;color:#94a3b8;margin-top:32px">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendJobFailureAlert(email: string, jobName: string, errorOutput: string, jobId: string) {
  if (!isEnabled()) return;
  const truncatedOutput = errorOutput.length > 500 ? errorOutput.slice(0, 500) + "…" : errorOutput;
  await resend!.emails.send({
    from: FROM,
    to: email,
    subject: `⚠ Job failed: ${jobName}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px">
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:24px">
          <h1 style="font-size:18px;font-weight:600;color:#dc2626;margin:0 0 8px">Job Failed: ${jobName}</h1>
          <p style="font-size:13px;color:#991b1b;margin:0">Your scheduled job encountered an error during execution.</p>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="font-size:12px;font-weight:600;color:#64748b;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px">Error Output</p>
          <pre style="font-size:12px;color:#334155;white-space:pre-wrap;word-break:break-word;margin:0;font-family:'SF Mono',Monaco,monospace">${truncatedOutput}</pre>
        </div>
        <a href="${APP_URL}/dashboard/${jobId}/history" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
          View Run History
        </a>
      </div>
    `,
  });
}

export { isEnabled as isEmailEnabled };
