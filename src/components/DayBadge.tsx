const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

interface DayBadgeProps {
  day: number;
  active: boolean;
  muted?: boolean;
}

export default function DayBadge({ day, active, muted = false }: DayBadgeProps) {
  return (
    <span
      title={DAY_NAMES[day]}
      aria-label={DAY_NAMES[day]}
      className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-medium transition-colors ${
        active
          ? muted
            ? "bg-violet-50 text-violet-500"
            : "bg-violet-100 text-violet-600"
          : "bg-slate-50 text-slate-300"
      }`}
    >
      {DAY_LABELS[day]}
    </span>
  );
}

export { DAY_LABELS, DAY_NAMES };
