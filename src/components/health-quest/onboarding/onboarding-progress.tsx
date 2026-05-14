"use client";

import { cn } from "@/lib/utils";

export function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-2 flex-1 rounded-full bg-muted transition-colors",
            index <= step ? "bg-primary" : null,
          )}
        />
      ))}
    </div>
  );
}
