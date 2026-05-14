"use client";

import { Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import type { LocalizedText, QuestLocale } from "@/lib/health-quest/types";

export function WeeklyMakeEasierCard({ suggestion, locale }: { suggestion?: LocalizedText; locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/86">
      <CardContent className="flex items-start gap-3 p-4">
        <Wand2 aria-hidden="true" className="mt-1 text-primary" />
        <p className="text-sm leading-6 text-muted-foreground">
          {suggestion ? text(suggestion, locale) : locale === "en" ? "Keep the smallest version ready." : "保留最細版本，隨時可以做。"}
        </p>
      </CardContent>
    </Card>
  );
}
