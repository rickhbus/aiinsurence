"use client";

import { Snowflake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuestLocale, UserStreak } from "@/lib/health-quest/types";

export function StreakFreezeCard({ streak, locale }: { streak: UserStreak; locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/86 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Snowflake aria-hidden="true" />
          {locale === "en" ? "Streak freezes" : "連續紀錄保護"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-sm leading-6 text-muted-foreground">
          {locale === "en"
            ? "You took a break. Your progress still matters."
            : "你休息咗一日，你嘅進度仍然重要。"}
        </p>
        <Badge variant="secondary">{streak.streakFreezeCount}</Badge>
      </CardContent>
    </Card>
  );
}
