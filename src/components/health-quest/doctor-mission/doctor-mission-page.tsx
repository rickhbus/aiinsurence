"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { text } from "@/lib/health-quest/copy";
import {
  buildDoctorVisitPlainText,
  buildDoctorVisitSummary,
  containsEmergencyRedFlag,
  doctorMissionDisclaimer,
} from "@/lib/health-quest/doctor-mission";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { DoctorExportButton } from "./doctor-export-button";
import { DoctorMissionStep } from "./doctor-mission-step";
import { DoctorSummaryPreview } from "./doctor-summary-preview";

const fields = [
  ["what_changed", { zh: "有咩改變？你最擔心邊一點？", en: "What changed, and what worries you most?" }],
  ["when_started", { zh: "幾時開始？期間有冇變化？", en: "When did it start, and has it changed over time?" }],
  ["better_or_worse", { zh: "咩情況會令佢好啲或差啲？", en: "What seems to make it better or worse?" }],
  ["tried", { zh: "你已經試過啲咩？", en: "What have you already tried?" }],
  ["top_questions", { zh: "最想問醫護嘅 3 條問題係咩？", en: "What are your top 3 questions for the clinician?" }],
] as const;

export function DoctorMissionPage({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const combined = Object.values(answers).join(" ");
  const urgent = containsEmergencyRedFlag(combined);

  async function save() {
    if (urgent) {
      toast.error(locale === "en" ? "Safety guidance comes first. Call 999 or go to Accident & Emergency now if urgent." : "安全指引優先。如情況緊急，請立即致電 999 或前往急症室。");
      return;
    }

    const headers = await getSupabaseRequestHeaders({ "Content-Type": "application/json", Accept: "application/json" });
    const response = await fetch("/api/health-quest/doctor-mission", {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: answers.what_changed?.slice(0, 120) || "Doctor prep",
        answers: fields.map(([stepKey]) => ({ stepKey, answerText: answers[stepKey] ?? "" })).filter((answer) => answer.answerText.trim()),
      }),
    }).catch(() => undefined);

    if (!response?.ok) {
      toast.error(locale === "en" ? "Doctor prep could not be saved." : "醫生準備暫時未能保存。");
      return;
    }

    toast.success(locale === "en" ? "Doctor prep saved." : "醫生準備已保存。");
  }

  async function copySummary() {
    await navigator.clipboard?.writeText(buildDoctorVisitPlainText(answers)).catch(() => undefined);
    toast.success(locale === "en" ? "Summary copied." : "摘要已複製。");
  }

  function downloadJson() {
    const summary = buildDoctorVisitSummary(answers);
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "doctor-visit-summary.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function printSummary() {
    window.print();
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
        <DoctorExportButton
          locale={locale}
          onCopy={copySummary}
          onDownloadJson={downloadJson}
          onPrint={printSummary}
        />
      </div>
      <DoctorSummaryPreview answers={answers} locale={locale} />
    </div>
  );
}
