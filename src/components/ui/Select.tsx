"use client";

import { forwardRef } from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  error?: string;
  label?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, error, label, className = "", id, ...rest }, ref) => {
    const trimmedError = error?.trim() || "";
    const hasError = trimmedError.length > 0;
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium"
            style={{ color: "var(--color-neutral-700)" }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-sm outline-none transition-all ${className}`}
          style={{
            backgroundColor: "var(--color-surface-bg)",
            borderColor: hasError
              ? "var(--color-error-500)"
              : "var(--color-neutral-200)",
            color: "var(--color-neutral-900)",
          }}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError && selectId ? `${selectId}-error` : undefined}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasError && (
          <p
            id={selectId ? `${selectId}-error` : undefined}
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

Select.displayName = "Select";

export default Select;
