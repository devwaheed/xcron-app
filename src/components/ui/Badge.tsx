export interface BadgeProps {
  variant?: "success" | "warning" | "error" | "neutral";
  children: React.ReactNode;
  className?: string;
}

const variantInline: Record<string, React.CSSProperties> = {
  success: {
    backgroundColor: "var(--color-success-50)",
    color: "var(--color-success-700)",
  },
  warning: {
    backgroundColor: "var(--color-warning-50)",
    color: "var(--color-warning-700)",
  },
  error: {
    backgroundColor: "var(--color-error-50)",
    color: "var(--color-error-700)",
  },
  neutral: {
    backgroundColor: "var(--color-neutral-100)",
    color: "var(--color-neutral-700)",
  },
};

export default function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={variantInline[variant]}
    >
      {children}
    </span>
  );
}
