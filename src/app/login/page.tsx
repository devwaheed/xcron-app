"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseApiResponse, networkErrorMessage } from "@/lib/api-client";
import { Logo } from "@/components/Logo";

const PLANS = [
  { id: 1, name: "Starter", priceCents: 4900, maxActions: 5, maxRunsPerMonth: 100 },
  { id: 2, name: "Pro", priceCents: 9900, maxActions: 15, maxRunsPerMonth: 500 },
  { id: 3, name: "Business", priceCents: 19900, maxActions: 50, maxRunsPerMonth: 2000 },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Signup fields
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [promoCode, setPromoCode] = useState("");

  // Reset fields
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
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
      if (!res.ok) {
        const apiError = await parseApiResponse(res, "Authentication failed");
        setError(apiError.message);
        return;
      }
      router.push("/dashboard");
    } catch { setError(networkErrorMessage("Login")); }
    finally { setLoading(false); }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          signup: true,
          plan_id: selectedPlan,
          promo_code: promoCode.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const apiError = await parseApiResponse(res, "Signup failed");
        setError(apiError.message);
        return;
      }
      router.push("/dashboard");
    } catch { setError(networkErrorMessage("Signup")); }
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
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-100/40 blur-[80px]" />
      </div>

      <div className={`w-full ${mode === "signup" ? "max-w-lg" : "max-w-md"}`}>
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <Logo showWordmark />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-8 shadow-xl shadow-slate-200/30 backdrop-blur-xl">
          {mode === "login" && (
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
              <div className="mt-5 flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setMode("reset"); setResetEmail(email); setResetMessage(""); setError(""); }}
                  className="text-violet-600 transition-colors hover:text-violet-500">Forgot Password?</button>
                <button type="button" onClick={() => { setMode("signup"); setError(""); }}
                  className="text-violet-600 transition-colors hover:text-violet-500">Create account</button>
              </div>
            </>
          )}

          {mode === "signup" && (
            <>
              <h1 className="mb-6 text-center text-xl font-semibold text-slate-900">Create your account</h1>
              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-slate-600">Email</label>
                  <input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                </div>
                <div>
                  <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-slate-600">Password</label>
                  <input id="signup-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                </div>

                {/* Plan Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">Choose a plan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLANS.map((plan) => (
                      <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          selectedPlan === plan.id
                            ? "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}>
                        <div className="text-sm font-semibold text-slate-900">{plan.name}</div>
                        <div className="text-lg font-bold text-slate-900">${(plan.priceCents / 100).toFixed(0)}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{plan.maxActions} actions · {plan.maxRunsPerMonth} runs</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Promo Code */}
                <div>
                  <label htmlFor="promo-code" className="mb-1.5 block text-sm font-medium text-slate-600">Promo Code <span className="text-slate-400">(optional)</span></label>
                  <input id="promo-code" type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Enter promo code"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                </div>

                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600">{error}</div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>
              <div className="mt-5 text-center">
                <button type="button" onClick={() => { setMode("login"); setError(""); }}
                  className="text-sm text-violet-600 transition-colors hover:text-violet-500">Already have an account? Sign in</button>
              </div>
            </>
          )}

          {mode === "reset" && (
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
                <button type="button" onClick={() => { setMode("login"); setError(""); }}
                  className="text-sm text-violet-600 transition-colors hover:text-violet-500">← Back to Sign in</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
