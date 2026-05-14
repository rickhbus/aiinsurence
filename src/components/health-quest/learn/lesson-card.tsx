"use client";

import { Card, CardContent } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import type { LocalizedText, QuestLocale } from "@/lib/health-quest/types";

export function LessonCard({ card, index, locale }: { card: LocalizedText; index: number; locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/88">
      <CardContent className="p-5">
        <p className="mb-2 text-xs font-medium text-muted-foreground">{locale === "en" ? `Card ${index + 1}` : `第 ${index + 1} 張`}</p>
        <p className="text-lg leading-8">{text(card, locale)}</p>
      </CardContent>
    </Card>
  );
}
