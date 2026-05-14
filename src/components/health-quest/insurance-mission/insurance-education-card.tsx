"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestLocale } from "@/lib/health-quest/types";

export function InsuranceEducationCard({ locale }: { locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/86">
      <CardHeader>
        <CardTitle>{locale === "en" ? "What not to assume" : "唔好假設"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm leading-6 text-muted-foreground">
        <p>{locale === "en" ? "Do not assume a benefit applies or that an application or claim outcome is already known." : "唔好假設某項保障適用，或申請／索償結果已經確定。"}</p>
        <p>{locale === "en" ? "Use this to prepare questions for a licensed adviser or the relevant insurer, broker, or employer." : "用嚟準備問題，之後問持牌顧問或相關保險公司、經紀、僱主。"}</p>
      </CardContent>
    </Card>
  );
}
