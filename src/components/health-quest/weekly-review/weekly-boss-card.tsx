"use client";

import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import type { QuestLocale } from "@/lib/health-quest/types";
import type { WeeklyHealthQuestReview } from "@/lib/health-quest/weekly-review";
import { WeeklyConsistencyRing } from "./weekly-consistency-ring";

export function WeeklyBossCard({ review, locale }: { review: WeeklyHealthQuestReview; locale: QuestLocale }) {
  return (
    <Card className="border-primary/30 bg-card/88 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy aria-hidden="true" />
          {locale === "en" ? "This Week, Not Perfect — Just Consistent" : "今週唔求完美，只求持續"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <WeeklyConsistencyRing value={review.requiredQuestCompletionRate} />
        <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
          <p>{text(review.streakSummary, locale)}</p>
          <p>{locale === "en" ? `${review.questsCompleted} quests completed` : `完成 ${review.questsCompleted} 個任務`}</p>
          <p>{locale === "en" ? `${review.xpEarned} XP earned this week` : `今週獲得 ${review.xpEarned} XP`}</p>
        </div>
      </CardContent>
    </Card>
  );
}
