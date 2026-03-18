"use client";

import { forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, className = "", id, ...rest }, ref) => {
    const trimmedError = error?.trim() || "";
    const hasError = trimmedError.length > 0;
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: "var(--color-neutral-700)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-sm outline-none transition-all placeholder:opacity-50 ${className}`}
          style={{
            backgroundColor: "var(--color-surface-bg)",
            borderColor: hasError
              ? "var(--color-error-500)"
              : "var(--color-neutral-200)",
            color: "var(--color-neutral-900)",
          }}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError && inputId ? `${inputId}-error` : undefined}
          {...rest}
        />
        {hasError && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            className="text-xs"
            role="alert"
            style={{ color: "var(--color-error-500)" }}
          >
            {trimmedError}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
