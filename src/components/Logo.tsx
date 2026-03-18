import React from "react";

interface LogoProps {
  variant?: "light" | "dark";
  showWordmark?: boolean;
  className?: string;
}

/**
 * xCron brand logo with optional wordmark.
 * `variant` controls which color scheme to use based on the background context.
 */
export function Logo({
  variant = "light",
  showWordmark = true,
  className,
}: LogoProps) {
  // Primary brand purple for light backgrounds, lighter tint for dark backgrounds
  const markColor = variant === "light" ? "#7c3aed" : "#a78bfa";
  const textColor = variant === "light" ? "#1e1b4b" : "#f5f3ff";

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
    >
      {/* Logo mark — stylised clock/bolt icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill={markColor} />
        <path
          d="M16 8v7l4 4"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 10l-2 6h4l-2 6"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark && (
        <svg
          width="72"
          height="20"
          viewBox="0 0 72 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <text
            x="0"
            y="16"
            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            fontSize="18"
            fontWeight="700"
            fill={textColor}
          >
            xCron
          </text>
        </svg>
      )}
    </span>
  );
}
