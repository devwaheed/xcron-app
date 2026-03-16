"use client";

import {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from "react";

export type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const TOAST_DURATION = 4000;
const EXIT_DURATION = 200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, EXIT_DURATION);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, variant, exiting: false }]);
      setTimeout(() => removeToast(id), TOAST_DURATION);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastMessage({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const isSuccess = toast.variant === "success";

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onDismiss(toast.id); }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-xl ${
        toast.exiting ? "toast-exit" : "toast-enter"
      } ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50/90 text-emerald-700"
          : "border-red-200 bg-red-50/90 text-red-700"
      }`}
    >
      <span className="mt-0.5 text-base" aria-hidden="true">{isSuccess ? "✓" : "✕"}</span>
      <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)}
        className="ml-2 shrink-0 text-sm opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss notification">×</button>
    </div>
  );
}
