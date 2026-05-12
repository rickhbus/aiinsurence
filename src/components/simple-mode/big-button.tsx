"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
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
        "flex min-h-24 w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left text-xl font-semibold tracking-normal shadow-sm transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 sm:min-h-28 sm:text-2xl",
        toneClassName[tone],
        className,
      )}
      {...props}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-background/65 text-3xl shadow-inner sm:size-14 sm:text-4xl">
        {emoji}
      </span>
      <span className="min-w-0 leading-tight">{children}</span>
    </button>
  );
}
