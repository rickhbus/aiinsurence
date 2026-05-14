"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { text } from "@/lib/health-quest/copy";
import { containsEmergencyRedFlag, doctorMissionDisclaimer } from "@/lib/health-quest/doctor-mission";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { DoctorExportButton } from "./doctor-export-button";
import { DoctorMissionStep } from "./doctor-mission-step";
import { DoctorSummaryPreview } from "./doctor-summary-preview";

const fields = [
  ["what_changed", { zh: "有咩改變？", en: "What changed?" }],
  ["when_started", { zh: "幾時開始？", en: "When did it start?" }],
  ["better_or_worse", { zh: "咩會令佢好啲或差啲？", en: "What makes it better or worse?" }],
  ["tried", { zh: "你試過咩？", en: "What have you tried?" }],
  ["top_questions", { zh: "最想問醫生嘅 3 條問題", en: "Top 3 questions for the doctor" }],
] as const;

export function DoctorMissionPage({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const combined = Object.values(answers).join(" ");
  const urgent = containsEmergencyRedFlag(combined);

  async function save() {
    const headers = await getSupabaseRequestHeaders({ "Content-Type": "application/json", Accept: "application/json" });
    await fetch("/api/health-quest/doctor-mission", {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: answers.what_changed?.slice(0, 120) || "Doctor prep",
        answers: fields.map(([stepKey]) => ({ stepKey, answerText: answers[stepKey] ?? "" })).filter((answer) => answer.answerText.trim()),
      }),
    }).catch(() => undefined);
    toast.success(locale === "en" ? "Doctor prep saved." : "醫生準備已保存。");
  }

  function exportSummary() {
    toast.message(locale === "en" ? "Summary preview is ready below." : "摘要預覽已準備好。");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-5">
        <Badge variant="secondary" className="mb-3">
          <Stethoscope data-icon="inline-start" aria-hidden="true" />
          Doctor Prep
        </Badge>
        <h1 className="text-3xl font-bold tracking-normal">{locale === "en" ? "Prepare questions for your visit" : "為面診準備問題"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{text(doctorMissionDisclaimer, locale)}</p>
      </section>
      {urgent ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          {locale === "en" ? "This may need urgent help. Call 999 or go to Accident & Emergency now if symptoms are severe or urgent." : "如果情況嚴重或緊急，請立即致電 999 或前往急症室。"}
        </div>
      ) : null}
      {fields.map(([key, label]) => (
        <DoctorMissionStep key={key} label={locale === "en" ? label.en : label.zh} value={answers[key] ?? ""} onChange={(value) => setAnswers({ ...answers, [key]: value })} />
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save}>{locale === "en" ? "Save mission" : "保存任務"}</Button>
        <DoctorExportButton locale={locale} onClick={exportSummary} />
      </div>
      <DoctorSummaryPreview answers={answers} locale={locale} />
    </div>
  );
}
