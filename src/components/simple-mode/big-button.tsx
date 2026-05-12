"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { seniorMode, seniorModeSetting } from "@/lib/health-app/senior-mode";
import { cn } from "@/lib/utils";

type BigButtonTone = "default" | "soft" | "warning" | "danger";

const toneClassName: Record<BigButtonTone, string> = {
  default: "border-primary/30 bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90",
  soft: "border-border bg-card text-card-foreground hover:bg-muted/70",
  warning: "border-amber-500/35 bg-amber-500/12 text-foreground hover:bg-amber-500/18",
  danger: "border-destructive/45 bg-destructive text-destructive-foreground shadow-destructive/20 hover:bg-destructive/90",
};

export function BigButton({
  emoji,
  children,
  tone = "soft",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  emoji: ReactNode;
  tone?: BigButtonTone;
}) {
  return (
    <button
      type="button"
        className={cn(
        "flex w-full items-center gap-4 rounded-xl border text-left font-bold tracking-normal shadow-sm disabled:pointer-events-none disabled:opacity-60",
        seniorMode && seniorModeSetting.biggerTapTargets
          ? "min-h-28 px-5 py-5 text-2xl sm:min-h-32 sm:text-3xl"
          : "min-h-24 px-5 py-4 text-xl sm:min-h-28 sm:text-2xl",
        seniorMode && seniorModeSetting.reducedAnimation ? "transition-colors" : "transition active:scale-[0.99]",
        toneClassName[tone],
        className,
      )}
      {...props}
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-background/80 text-4xl shadow-inner sm:size-16 sm:text-5xl">
        {emoji}
      </span>
      <span className="min-w-0 leading-tight">{children}</span>
    </button>
  );
}
