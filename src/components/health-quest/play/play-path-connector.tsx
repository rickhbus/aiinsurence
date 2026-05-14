import { cn } from "@/lib/utils";

export function PlayPathConnector({
  state = "normal",
  className,
}: {
  state?: "normal" | "done" | "locked" | "recovery" | "safety";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute left-1/2 top-full h-14 w-2 -translate-x-1/2 rounded-full",
        state === "done" && "bg-emerald-400",
        state === "recovery" && "bg-amber-300",
        state === "safety" && "bg-red-300",
        state === "locked" && "bg-border",
        state === "normal" && "bg-teal-300/70",
        className,
      )}
    />
  );
}

