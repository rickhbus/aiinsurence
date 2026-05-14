"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LocalizedText, QuestLocale } from "@/lib/health-quest/types";
import { text } from "@/lib/health-quest/copy";
import { cn } from "@/lib/utils";

export type OnboardingOption = {
  value: string;
  label: LocalizedText;
  description: LocalizedText;
  icon?: LucideIcon;
};

export function StepCards({
  options,
  value,
  locale,
  onChange,
}: {
  options: OnboardingOption[];
  value: string;
  locale: QuestLocale;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            className="text-left"
            onClick={() => onChange(option.value)}
          >
            <Card className={cn(
              "border-border/60 bg-card/88 transition-all hover:border-primary/60",
              selected ? "border-primary bg-primary/8 ring-2 ring-primary/25" : null,
            )}>
              <CardContent className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4">
                {Icon ? (
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon aria-hidden="true" />
                  </span>
                ) : null}
                <span className="min-w-0">
                  <strong className="block text-base">{text(option.label, locale)}</strong>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {text(option.description, locale)}
                  </span>
                </span>
                {selected ? (
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check aria-hidden="true" />
                  </span>
                ) : null}
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
