"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { getTimezones } from "@/components/SchedulePicker";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Logo } from "@/components/Logo";

interface ProfileData {
  email: string;
  displayName: string | null;
  timezone: string;
}

export default function ProfilePage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  // Plan & promo state
  const [planName, setPlanName] = useState("");
  const [planLimits, setPlanLimits] = useState<{ actions: number; runs: number; retention: number } | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const timezones = getTimezones();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        setError("Failed to load profile");
        return;
      }
      const data: ProfileData = await res.json();
      setProfile(data);
      setDisplayName(data.displayName ?? "");
      setTimezone(data.timezone);
      setError("");
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setPlanName(data.planName);
        setPlanLimits({
          actions: data.actions.limit,
          runs: data.runs.limit,
          retention: data.logRetentionDays,
        });
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchUsage();
  }, [fetchProfile, fetchUsage]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          timezone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to save profile" }));
        showToast(data.error || "Failed to save profile", "error");
        return;
      }

      const updated: ProfileData = await res.json();
      setProfile(updated);
      setDisplayName(updated.displayName ?? "");
      setTimezone(updated.timezone);
      showToast("Profile updated successfully");
    } catch {
      showToast("Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  }

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
    } catch {
      setPromoMessage({ type: "error", text: "Failed to redeem code" });
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-100/60 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-100/50 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo showWordmark />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-semibold text-slate-900">Profile</h1>

        {loading ? (
          <Card>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <div role="alert" className="text-sm text-red-600">
              {error}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-6">
              {/* Email (read-only) */}
              <Input
                label="Email"
                value={profile?.email ?? ""}
                readOnly
                className="cursor-not-allowed opacity-70"
              />

              {/* Display Name */}
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                maxLength={100}
              />

              {/* Timezone Picker */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="timezone"
                  className="text-sm font-medium"
                  style={{ color: "var(--color-neutral-700)" }}
                >
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  aria-label="Timezone"
                  className="w-full rounded-[var(--radius-md)] border px-3 py-2 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "var(--color-surface-bg)",
                    borderColor: "var(--color-neutral-200)",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Button */}
              <Button onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
            </div>
          </Card>
        )}

        {/* Current Plan */}
        {!loading && !error && planName && (
          <Card className="mt-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Current Plan</h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Plan: <span className="font-medium text-slate-900">{planName}</span></p>
              {planLimits && (
                <>
                  <p>{planLimits.actions} actions · {planLimits.runs.toLocaleString()} runs/month · {planLimits.retention >= 365 ? "1 year" : `${planLimits.retention} days`} log retention</p>
                </>
              )}
            </div>
            <Link href="/pricing"
              className="mt-4 inline-block rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-600 transition-all hover:bg-violet-100">
              Change Plan
            </Link>
          </Card>
        )}

        {/* Redeem Code */}
        {!loading && !error && (
          <Card className="mt-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Redeem Code</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
              <Button onClick={handleRedeem} loading={redeeming}>
                Redeem
              </Button>
            </div>
            {promoMessage && (
              <p className={`mt-2 text-sm ${promoMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                {promoMessage.text}
              </p>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
