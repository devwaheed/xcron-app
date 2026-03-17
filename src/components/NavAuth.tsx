"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export default function NavAuth() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setChecked(true);
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setLoggedIn(false);
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoggingOut(false);
    }
  }

  if (!checked) {
    // Render placeholder to avoid layout shift
    return (
      <div className="flex items-center gap-3">
        <div className="h-5 w-14" />
        <div className="h-9 w-24 rounded-full bg-slate-100" />
      </div>
    );
  }

  if (loggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
        Sign in
      </Link>
      <Link
        href="/login"
        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800"
      >
        Get started
      </Link>
    </div>
  );
}
