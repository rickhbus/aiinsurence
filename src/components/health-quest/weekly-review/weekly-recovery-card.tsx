"use client";

import { HeartPulse } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { QuestLocale } from "@/lib/health-quest/types";

export function WeeklyRecoveryCard({ recoveryDays, safetyEvents, locale }: { recoveryDays: number; safetyEvents: number; locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/86">
      <CardContent className="grid gap-2 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <HeartPulse aria-hidden="true" />
          {locale === "en" ? "Recovery and safety" : "恢復同安全"}
        </p>
        <p>{locale === "en" ? `${recoveryDays} recovery days counted` : `${recoveryDays} 日恢復已計算`}</p>
        <p>{locale === "en" ? `${safetyEvents} safety banners shown, without raw details` : `${safetyEvents} 次安全提示，不顯示原始細節`}</p>
      </CardContent>
    </Card>
  );
}
