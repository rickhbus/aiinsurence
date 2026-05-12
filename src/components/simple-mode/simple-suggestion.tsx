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
        "rounded-xl border bg-card/95 p-5 text-card-foreground shadow-sm",
        result.tone === "warning" && "border-amber-500/35 bg-amber-500/10",
        result.tone === "danger" && "border-destructive/35 bg-destructive/10",
      )}
    >
      <p className="text-2xl font-bold tracking-normal">{result.confirmation}</p>
      <p className="mt-3 text-xl leading-8 text-foreground">{result.suggestion}</p>
    </section>
  );
}
