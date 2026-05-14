"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestLocale, QuestType } from "@/lib/health-quest/types";

export function WeeklyHabitBreakdown({
  consistent,
  skipped,
  locale,
}: {
  consistent?: QuestType;
  skipped?: QuestType;
  locale: QuestLocale;
}) {
  return (
    <Card className="border-border/60 bg-card/86">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 aria-hidden="true" />
          {locale === "en" ? "Habit pattern" : "習慣模式"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-muted-foreground">
        <p>{locale === "en" ? `Most consistent: ${consistent ?? "not enough data"}` : `最穩定：${consistent ?? "資料未足夠"}`}</p>
        <p>{locale === "en" ? `Most skipped: ${skipped ?? "none"}` : `最多略過：${skipped ?? "無"}`}</p>
      </CardContent>
    </Card>
  );
}
