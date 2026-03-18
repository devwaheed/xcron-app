"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount.
 * Placed in the root layout so it runs once on app load.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — non-critical, app works without it
      });
    }
  }, []);

  return null;
}
