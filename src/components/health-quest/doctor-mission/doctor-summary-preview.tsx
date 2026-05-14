"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import { buildDoctorVisitSummary } from "@/lib/health-quest/doctor-mission";
import type { QuestLocale } from "@/lib/health-quest/types";

export function DoctorSummaryPreview({ answers, locale }: { answers: Record<string, string>; locale: QuestLocale }) {
  const summary = buildDoctorVisitSummary(answers);

  return (
    <Card className="border-border/60 bg-card/86">
      <CardHeader><CardTitle>{locale === "en" ? "Visit summary preview" : "面診摘要預覽"}</CardTitle></CardHeader>
      <CardContent className="grid gap-2 text-sm leading-6 text-muted-foreground">
        <p>{summary.mainConcern}</p>
        <p>{summary.timeline}</p>
        <p>{summary.patternSummary}</p>
        <p>{summary.tried}</p>
        <ul className="list-disc pl-5">
          {summary.questions.map((question) => <li key={question}>{question}</li>)}
        </ul>
        <p>{text(summary.disclaimer, locale)}</p>
      </CardContent>
    </Card>
  );
}
