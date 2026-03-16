"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

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

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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
    } catch {
      setResetMessage("If an account exists with that email, a reset link has been sent.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-white transition-colors hover:text-purple-300">
            Cron Job Builder
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          {!showReset ? (
            <>
              <h1 className="mb-6 text-center text-2xl font-bold text-white">
                Sign in
              </h1>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(true);
                    setResetEmail(email);
                    setResetMessage("");
                  }}
                  className="text-sm text-purple-400 transition-colors hover:text-purple-300"
                >
                  Forgot Password?
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-center text-2xl font-bold text-white">
                Reset Password
              </h1>
              <p className="mb-6 text-center text-sm text-slate-400">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {resetMessage && (
                  <div role="status" className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    {resetMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resetLoading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(false);
                    setError("");
                  }}
                  className="text-sm text-purple-400 transition-colors hover:text-purple-300"
                >
                  ← Back to Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
