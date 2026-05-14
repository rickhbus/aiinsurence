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
        <p>{locale === "en" ? "Do not assume a benefit applies or an application/claim outcome is guaranteed." : "唔好假設某項保障適用，或申請／索償結果有保證。"}</p>
        <p>{locale === "en" ? "Check policy wording and contact a qualified or licensed professional if needed." : "需要時請查閱保單條款並聯絡合資格或持牌專業人士。"}</p>
      </CardContent>
    </Card>
  );
}
