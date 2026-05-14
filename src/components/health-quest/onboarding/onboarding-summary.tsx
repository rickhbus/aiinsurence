"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestLocale } from "@/lib/health-quest/types";

export function OnboardingSummary({
  locale,
  goal,
  time,
  path,
}: {
  locale: QuestLocale;
  goal: string;
  time: string;
  path: string;
}) {
  return (
    <Card className="border-border/60 bg-card/88">
      <CardHeader>
        <CardTitle>{locale === "en" ? "Your tiny path is ready" : "你嘅小小路線準備好啦"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm leading-6 text-muted-foreground">
        <p>{locale === "en" ? `Goal: ${goal}` : `目標：${goal}`}</p>
        <p>{locale === "en" ? `Daily time: ${time}` : `每日時間：${time}`}</p>
        <p>{locale === "en" ? `Starting path: ${path}` : `起始路線：${path}`}</p>
        <p>
          {locale === "en"
            ? "Emergency guidance stays free and ungated. This app gives general lifestyle support, not medical diagnosis."
            : "緊急提示永遠免費、不設限制。本應用提供一般生活健康支援，並非醫療診斷。"}
        </p>
      </CardContent>
    </Card>
  );
}
