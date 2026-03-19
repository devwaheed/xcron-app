"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/Toast";
import { getTimezones } from "@/components/SchedulePicker";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  const timezones = getTimezones();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) { setError("Failed to load profile"); return; }
      const data: ProfileData = await res.json();
      setProfile(data);
      setDisplayName(data.displayName ?? "");
      setTimezone(data.timezone);
      setError("");
    } catch { setError("Failed to load profile"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, timezone }),
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
    } catch { showToast("Failed to save profile", "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-8 text-xl font-semibold text-slate-900">Account</h1>

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
            <div role="alert" className="text-sm text-red-600">{error}</div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-6">
              <Input label="Email" value={profile?.email ?? ""} readOnly className="cursor-not-allowed opacity-70" />
              <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your display name" maxLength={100} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="timezone" className="text-sm font-medium" style={{ color: "var(--color-neutral-700)" }}>Timezone</label>
                <select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} aria-label="Timezone"
                  className="w-full rounded-[var(--radius-md)] border px-3 py-2 text-sm outline-none transition-all"
                  style={{ backgroundColor: "var(--color-surface-bg)", borderColor: "var(--color-neutral-200)", color: "var(--color-neutral-900)" }}>
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleSave} loading={saving}>Save Changes</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
