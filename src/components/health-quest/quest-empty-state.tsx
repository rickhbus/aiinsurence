import { CircleDashed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestLocale } from "@/lib/health-quest/types";

export function QuestEmptyState({ locale }: { locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/82 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDashed aria-hidden="true" />
          {locale === "zh-Hant" ? "今日未有任務" : "No quests today"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {locale === "zh-Hant" ? "稍後再試，或先飲一杯水都算一個好開始。" : "Try again later, or start with a glass of water."}
      </CardContent>
    </Card>
  );
}
