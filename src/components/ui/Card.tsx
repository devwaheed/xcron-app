export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const paddingStyles: Record<string, string> = {
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export default function Card({
  children,
  className = "",
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-xl)] ${paddingStyles[padding]} ${className}`}
      style={{
        backgroundColor: "var(--color-surface-bg)",
        border: "1px solid var(--color-neutral-200)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {children}
    </div>
  );
}
