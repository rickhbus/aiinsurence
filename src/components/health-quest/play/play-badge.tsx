import type { ComponentProps } from "react";
import { playToneClasses, type PlayTone } from "@/lib/health-quest/play-system";
import { cn } from "@/lib/utils";

export function PlayBadge({
  tone = "primary",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: PlayTone }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center justify-center gap-1 rounded-full border px-2.5 text-xs font-bold",
        playToneClasses[tone].surface,
        playToneClasses[tone].text,
        playToneClasses[tone].border,
        className,
      )}
      {...props}
    />
  );
}

