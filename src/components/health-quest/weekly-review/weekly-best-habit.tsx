"use client";

import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { QuestLocale, QuestType } from "@/lib/health-quest/types";

export function WeeklyBestHabit({ habit, locale }: { habit?: QuestType; locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/86">
      <CardContent className="flex items-center gap-3 p-4">
        <Sparkles aria-hidden="true" className="text-primary" />
        <p className="text-sm">{locale === "en" ? `Best habit: ${habit ?? "keep showing up"}` : `最佳習慣：${habit ?? "繼續出現已經好好"}`}</p>
      </CardContent>
    </Card>
  );
}
