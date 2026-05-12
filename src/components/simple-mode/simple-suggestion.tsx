"use client";

import { cn } from "@/lib/utils";

export type SimpleSuggestionState = {
  confirmation: string;
  suggestion: string;
  tone?: "default" | "warning" | "danger";
};

export function SimpleSuggestion({ result }: { result: SimpleSuggestionState | null }) {
  if (!result) {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className={cn(
        "rounded-2xl border bg-card/90 p-5 text-card-foreground shadow-sm",
        result.tone === "warning" && "border-amber-500/35 bg-amber-500/10",
        result.tone === "danger" && "border-destructive/35 bg-destructive/10",
      )}
    >
      <p className="text-lg font-semibold tracking-normal">{result.confirmation}</p>
      <p className="mt-2 text-base leading-7 text-muted-foreground">{result.suggestion}</p>
    </section>
  );
}
