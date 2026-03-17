"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    // Session lives in an httpOnly cookie set by the login API,
    // not in the Supabase browser client. Check via a quick fetch
    // to an authenticated endpoint instead.
    fetch("/api/actions", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          router.replace("/dashboard");
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => setCheckingAuth(false));
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Authentication failed"); return; }
      router.push("/dashboard");
    } catch { setError("An unexpected error occurred. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetMessage("");
    setResetLoading(true);
    try {
      await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetMessage("If an account exists with that email, a reset link has been sent.");
    } catch { setResetMessage("If an account exists with that email, a reset link has been sent."); }
    finally { setResetLoading(false); }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-100/60 blur-[100px]" />
        <div className="absolute -bottom-40 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-100/50 blur-[100px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">xCron</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-8 shadow-xl shadow-slate-200/30 backdrop-blur-xl">
          {!showReset ? (
            <>
              <h1 className="mb-6 text-center text-xl font-semibold text-slate-900">Sign in to your account</h1>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-600">Email</label>
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-600">Password</label>
                  <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                </div>
                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600">{error}</div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>
              <div className="mt-5 text-center">
                <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setResetMessage(""); }}
                  className="text-sm text-violet-600 transition-colors hover:text-violet-500">Forgot Password?</button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-center text-xl font-semibold text-slate-900">Reset Password</h1>
              <p className="mb-6 text-center text-sm text-slate-400">Enter your email and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-slate-600">Email</label>
                  <input id="reset-email" type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                </div>
                {resetMessage && (
                  <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-600">{resetMessage}</div>
                )}
                <button type="submit" disabled={resetLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                  {resetLoading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
              <div className="mt-5 text-center">
                <button type="button" onClick={() => { setShowReset(false); setError(""); }}
                  className="text-sm text-violet-600 transition-colors hover:text-violet-500">← Back to Sign in</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
