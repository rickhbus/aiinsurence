import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { playToneClasses, type PlayTone } from "@/lib/health-quest/play-system";
import { cn } from "@/lib/utils";

export function PlayButton({
  tone = "primary",
  className,
  ...props
}: ComponentProps<typeof Button> & { tone?: PlayTone }) {
  return (
    <Button
      className={cn(
        "min-h-12 rounded-2xl px-4 text-sm font-bold shadow-[0_9px_0_rgba(15,23,42,0.13)] active:translate-y-1 active:shadow-[0_4px_0_rgba(15,23,42,0.13)]",
        playToneClasses[tone].solid,
        className,
      )}
      {...props}
    />
  );
}

