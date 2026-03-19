"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

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

export default function PricingPage() {
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
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
          setCurrentPlanName(data.planName);
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

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-100/50 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo showWordmark />
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50">
                Dashboard
              </Link>
            ) : (
              <Link href="/login"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-14 text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Simple pricing, no surprises
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            One-time payment. Pick a plan, start automating, own it forever.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanName === plan.name;

            return plan.popular ? (
              /* ── Highlighted Pro card with gradient glow ── */
              <div key={plan.id} className="relative flex flex-col lg:-mt-4">
                {/* Gradient glow behind card */}
                <div className="absolute -inset-[2px] rounded-[18px] bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 opacity-75 blur-lg" />
                {/* Gradient ring */}
                <div className="absolute -inset-[2px] rounded-[18px] bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500" />
                <div className="relative flex flex-1 flex-col rounded-2xl bg-white p-8">
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
                  <div className="mt-8">
                    {isCurrent ? (
                      <span className="flex w-full items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-600">
                        Current Plan
                      </span>
                    ) : stripeEnabled ? (
                      <button onClick={() => handleBuy(plan.id)} disabled={loading === plan.id}
                        className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/25 hover:brightness-110 disabled:opacity-50">
                        {loading === plan.id ? "Redirecting…" : "Get started"}
                      </button>
                    ) : (
                      <span className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                        Use promo code in profile
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Standard card ── */
              <div key={plan.id} className="relative flex flex-col rounded-2xl bg-white p-8 ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-slate-300">
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
                <div className="mt-8">
                  {isCurrent ? (
                    <span className="flex w-full items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-600">
                      Current Plan
                    </span>
                  ) : stripeEnabled ? (
                    <button onClick={() => handleBuy(plan.id)} disabled={loading === plan.id}
                      className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:ring-slate-300 disabled:opacity-50">
                      {loading === plan.id ? "Redirecting…" : "Get started"}
                    </button>
                  ) : (
                    <span className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                      Use promo code in profile
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          All plans include encrypted execution, GitHub-backed infrastructure, and automatic retries. Have a promo code? Redeem it in your profile after signup.
        </p>

        {/* Comparison table */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-xl font-semibold text-slate-900">Compare plans</h2>
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-4 text-left font-medium text-slate-500">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="px-6 py-4 text-center font-semibold text-slate-900">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: "Scheduled actions", values: ["5", "15", "50"] },
                  { label: "Runs per month", values: ["100", "500", "2,000"] },
                  { label: "Log retention", values: ["30 days", "90 days", "1 year"] },
                  { label: "Price", values: ["$49", "$99", "$199"] },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="px-6 py-3.5 text-slate-600">{row.label}</td>
                    {row.values.map((v, idx) => (
                      <td key={idx} className="px-6 py-3.5 text-center font-medium text-slate-900">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
