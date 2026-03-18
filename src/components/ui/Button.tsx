"use client";

import { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantStyles: Record<string, string> = {
  primary:
    "text-white shadow-[var(--shadow-sm)] hover:opacity-90",
  secondary:
    "border hover:opacity-90",
  ghost:
    "hover:opacity-80",
  danger:
    "text-white shadow-[var(--shadow-sm)] hover:opacity-90",
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm rounded-[var(--radius-md)]",
  md: "px-4 py-2 text-sm rounded-[var(--radius-lg)]",
  lg: "px-6 py-3 text-base rounded-[var(--radius-lg)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      style,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const variantInline: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: "var(--color-primary-500)",
      },
      secondary: {
        backgroundColor: "var(--color-surface-bgSecondary)",
        borderColor: "var(--color-neutral-200)",
        color: "var(--color-neutral-900)",
      },
      ghost: {
        backgroundColor: "transparent",
        color: "var(--color-neutral-700)",
      },
      danger: {
        backgroundColor: "var(--color-error-500)",
      },
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-medium transition-all ${variantStyles[variant]} ${sizeStyles[size]} ${
          isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${className}`}
        style={{ ...variantInline[variant], ...style }}
        {...rest}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
