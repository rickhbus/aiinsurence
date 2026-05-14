import type { ReactNode } from "react";
import { Mascot, type MascotMood } from "./mascot-reaction";
import { cn } from "@/lib/utils";

export function MascotMessage({
  mood = "idle",
  children,
  className,
}: {
  mood?: MascotMood;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-[1.4rem] border border-teal-500/15 bg-teal-500/8 p-3", className)}>
      <Mascot mood={mood} size="sm" />
      <div className="min-w-0 text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}
