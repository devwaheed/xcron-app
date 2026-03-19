"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface PlanDisplay {
  id: number;
  name: string;
  priceCents: number;
  maxActions: number;
  maxRunsPerMonth: number;
  logRetentionDays: number;
}

const PLANS: PlanDisplay[] = [
  { id: 1, name: "Starter", priceCents: 4900, maxActions: 5, maxRunsPerMonth: 100, logRetentionDays: 30 },
  { id: 2, name: "Pro", priceCents: 9900, maxActions: 15, maxRunsPerMonth: 500, logRetentionDays: 90 },
  { id: 3, name: "Business", priceCents: 19900, maxActions: 50, maxRunsPerMonth: 2000, logRetentionDays: 365 },
];

export default function PricingPage() {
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          // Determine current plan from plan name
          const match = PLANS.find((p) => p.name === data.planName);
          if (match) setCurrentPlanId(match.id);
        }
      } catch {
        // Not authenticated
      }
    }
    checkAuth();
  }, []);

  async function handleBuy(planId: number) {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/pricing`;
      return;
    }
    setLoading(planId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      });
      if (res.status === 501) {
        setStripeEnabled(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(null);
    }
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(0)}`;
  }

  function formatRetention(days: number) {
    if (days >= 365) return "1 year";
    return `${days} days`;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-100/60 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-100/50 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo showWordmark />
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
                Dashboard
              </Link>
            ) : (
              <Link href="/login"
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:brightness-110">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Simple, transparent pricing</h1>
          <p className="mt-3 text-lg text-slate-500">Choose the plan that fits your automation needs.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isPopular = plan.id === 2;
            return (
              <div key={plan.id}
                className={`relative rounded-2xl border p-6 shadow-sm transition-all ${
                  isPopular ? "border-violet-300 bg-violet-50/30 shadow-violet-100" : "border-slate-200 bg-white"
                } ${isCurrent ? "ring-2 ring-violet-500" : ""}`}>
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-medium text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-900">{formatPrice(plan.priceCents)}</span>
                  <span className="text-sm text-slate-500"> one-time</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckIcon /> {plan.maxActions} actions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon /> {plan.maxRunsPerMonth.toLocaleString()} runs/month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon /> {formatRetention(plan.logRetentionDays)} log retention
                  </li>
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <span className="block w-full rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-center text-sm font-medium text-violet-600">
                      Current Plan
                    </span>
                  ) : stripeEnabled ? (
                    <button onClick={() => handleBuy(plan.id)} disabled={loading === plan.id}
                      className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-50">
                      {loading === plan.id ? "Redirecting…" : "Get Started"}
                    </button>
                  ) : (
                    <span className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-center text-sm text-slate-400">
                      Use promo code
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features comparison */}
        <div className="mt-16 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 text-left font-medium text-slate-500">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.id} className="py-3 text-center font-medium text-slate-900">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 text-slate-600">Actions</td>
                {PLANS.map((p) => <td key={p.id} className="py-3 text-center text-slate-900">{p.maxActions}</td>)}
              </tr>
              <tr>
                <td className="py-3 text-slate-600">Runs per month</td>
                {PLANS.map((p) => <td key={p.id} className="py-3 text-center text-slate-900">{p.maxRunsPerMonth.toLocaleString()}</td>)}
              </tr>
              <tr>
                <td className="py-3 text-slate-600">Log retention</td>
                {PLANS.map((p) => <td key={p.id} className="py-3 text-center text-slate-900">{formatRetention(p.logRetentionDays)}</td>)}
              </tr>
              <tr>
                <td className="py-3 text-slate-600">Price</td>
                {PLANS.map((p) => <td key={p.id} className="py-3 text-center font-medium text-slate-900">{formatPrice(p.priceCents)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500 shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
