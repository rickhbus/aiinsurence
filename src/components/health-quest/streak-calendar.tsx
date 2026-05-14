"use client";

import { Flame } from "lucide-react";
import type { QuestLocale } from "@/lib/health-quest/types";
import { cn } from "@/lib/utils";

export function StreakCalendar({
  activeDays,
  locale,
}: {
  activeDays: string[];
  locale: QuestLocale;
}) {
  const active = new Set(activeDays);
  const days = Array.from({ length: 7 }, (_, index) => index);

  return (
    <div className="rounded-3xl border border-border/60 bg-card/80 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Flame aria-hidden="true" />
        {locale === "en" ? "This week" : "今週"}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <span
            key={day}
            className={cn(
              "grid aspect-square place-items-center rounded-2xl bg-muted text-xs",
              active.has(String(day)) ? "bg-primary text-primary-foreground" : null,
            )}
          >
            {day + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
