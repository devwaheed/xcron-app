"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UsageDisplay from "@/components/UsageDisplay";

export default function BillingPage() {
  const [planName, setPlanName] = useState("");
  const [planLimits, setPlanLimits] = useState<{ actions: number; runs: number; retention: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [promoCode, setPromoCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setPlanName(data.planName);
        setPlanLimits({ actions: data.actions.limit, runs: data.runs.limit, retention: data.logRetentionDays });
      }
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  async function handleRedeem() {
    if (!promoCode.trim()) return;
    setRedeeming(true);
    setPromoMessage(null);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromoMessage({ type: "success", text: `Plan upgraded to ${data.planName}` });
        setPromoCode("");
        fetchUsage();
      } else {
        setPromoMessage({ type: "error", text: data.error || "Failed to redeem code" });
      }
    } catch { setPromoMessage({ type: "error", text: "Failed to redeem code" }); }
    finally { setRedeeming(false); }
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-8 text-xl font-semibold text-slate-900">Billing & Usage</h1>

        {/* Usage overview */}
        <div className="mb-6">
          <UsageDisplay />
        </div>

        {/* Current plan */}
        {loading ? (
          <Card>
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
            </div>
          </Card>
        ) : planName ? (
          <Card>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Current Plan</h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Plan: <span className="font-medium text-slate-900">{planName}</span></p>
              {planLimits && (
                <p>{planLimits.actions} jobs · {planLimits.runs.toLocaleString()} runs/month · {planLimits.retention >= 365 ? "1 year" : `${planLimits.retention} days`} log retention</p>
              )}
            </div>
            <Link href="/pricing"
              className="mt-4 inline-block rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-600 transition-all hover:bg-violet-100">
              Change Plan
            </Link>
          </Card>
        ) : null}

        {/* Redeem code */}
        <Card className="mt-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Redeem Code</h2>
          <div className="flex gap-2">
            <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code"
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
            <Button onClick={handleRedeem} loading={redeeming}>Redeem</Button>
          </div>
          {promoMessage && (
            <p className={`mt-2 text-sm ${promoMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {promoMessage.text}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
