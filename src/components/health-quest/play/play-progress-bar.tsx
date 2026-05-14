import { cn } from "@/lib/utils";

export function PlayProgressBar({
  value,
  className,
  tone = "primary",
}: {
  value: number;
  className?: string;
  tone?: "primary" | "accent" | "success";
}) {
  const width = `${Math.max(0, Math.min(100, Math.round(value)))}%`;
  const fill = tone === "accent"
    ? "bg-amber-400"
    : tone === "success"
      ? "bg-emerald-500"
      : "bg-teal-500";

  return (
    <div className={cn("h-3 overflow-hidden rounded-full bg-slate-900/8 p-0.5 dark:bg-white/10", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", fill)} style={{ width }} />
    </div>
  );
}

