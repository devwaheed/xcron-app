"use client";

export interface EmptyStateProps {
  illustration: "no-actions" | "no-runs";
  heading: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

function NoActionsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label="No actions illustration"
    >
      {/* Clock face */}
      <circle
        cx="60"
        cy="60"
        r="44"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.2"
        fill="var(--color-primary-50, #f5f3ff)"
      />
      <circle
        cx="60"
        cy="60"
        r="36"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        fill="var(--color-surface-bg, #ffffff)"
      />
      {/* Hour markers */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <line
          key={deg}
          x1="60"
          y1="28"
          x2="60"
          y2="32"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.3"
          strokeLinecap="round"
          transform={`rotate(${deg} 60 60)`}
        />
      ))}
      {/* Clock hands */}
      <line
        x1="60"
        y1="60"
        x2="60"
        y2="38"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <line
        x1="60"
        y1="60"
        x2="76"
        y2="52"
        stroke="var(--color-primary-500, #7c3aed)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx="60" cy="60" r="3" fill="var(--color-primary-500, #7c3aed)" />
      {/* Calendar accent */}
      <rect
        x="78"
        y="74"
        width="24"
        height="22"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        fill="var(--color-primary-100, #ede9fe)"
      />
      <line
        x1="84"
        y1="72"
        x2="84"
        y2="78"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
      <line
        x1="96"
        y1="72"
        x2="96"
        y2="78"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
      <line
        x1="78"
        y1="82"
        x2="102"
        y2="82"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.2"
      />
    </svg>
  );
}

function NoRunsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label="No runs illustration"
    >
      {/* Outer circle */}
      <circle
        cx="60"
        cy="60"
        r="44"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.2"
        fill="var(--color-primary-50, #f5f3ff)"
      />
      {/* Play button triangle */}
      <path
        d="M50 40 L80 60 L50 80Z"
        stroke="var(--color-primary-500, #7c3aed)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="var(--color-primary-100, #ede9fe)"
      />
      {/* History arc */}
      <path
        d="M28 72 A38 38 0 0 1 28 48"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.3"
        fill="none"
      />
      {/* Arrow on arc */}
      <polyline
        points="24,50 28,44 34,48"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.3"
        fill="none"
      />
      {/* Dashed timeline */}
      <line
        x1="60"
        y1="90"
        x2="60"
        y2="110"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        strokeOpacity="0.2"
      />
      <circle cx="60" cy="98" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="60" cy="106" r="2" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

const illustrations = {
  "no-actions": NoActionsIllustration,
  "no-runs": NoRunsIllustration,
};

export default function EmptyState({
  illustration,
  heading,
  description,
  action,
}: EmptyStateProps) {
  const Illustration = illustrations[illustration];

  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div
        className="rounded-2xl border p-12 backdrop-blur-xl"
        style={{
          borderColor: "var(--color-neutral-200, #e2e8f0)",
          backgroundColor: "var(--color-surface-bg, #ffffff)",
          opacity: 0.95,
        }}
      >
        <div className="mx-auto mb-6 flex items-center justify-center" style={{ color: "var(--color-neutral-500, #64748b)" }}>
          <Illustration />
        </div>
        <p
          className="mb-2 text-lg font-semibold"
          style={{ color: "var(--color-neutral-900, #0f172a)" }}
        >
          {heading}
        </p>
        <p
          className="text-sm"
          style={{ color: "var(--color-neutral-400, #94a3b8)" }}
        >
          {description}
        </p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
            style={{
              background: "linear-gradient(to right, var(--color-primary-500, #7c3aed), var(--color-secondary-600, #0284c7))",
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
