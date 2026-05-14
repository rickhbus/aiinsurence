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
	        "play-pressable min-h-12 rounded-2xl px-4 text-sm font-black",
	        playToneClasses[tone].solid,
	        className,
      )}
      {...props}
    />
  );
}
