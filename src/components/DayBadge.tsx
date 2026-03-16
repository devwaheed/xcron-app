const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
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
      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
        active
          ? muted
            ? "bg-purple-500/30 text-purple-300"
            : "bg-purple-500/40 text-purple-200"
          : "bg-white/5 text-slate-600"
      }`}
    >
      {DAY_LABELS[day]}
    </span>
  );
}

export { DAY_LABELS, DAY_NAMES };
