"use client";

import { Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import type { LocalizedText, QuestLocale } from "@/lib/health-quest/types";

export function WeeklyNextGoalCard({ goal, locale }: { goal: LocalizedText; locale: QuestLocale }) {
  return (
    <Card className="border-primary/25 bg-primary/8">
      <CardContent className="flex items-start gap-3 p-4">
        <Target aria-hidden="true" className="mt-1 text-primary" />
        <p className="text-sm leading-6">{text(goal, locale)}</p>
      </CardContent>
    </Card>
  );
}
