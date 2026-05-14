"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { text } from "@/lib/health-quest/copy";
import { insuranceBoundary } from "@/lib/health-quest/insurance-mission";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { InsuranceBoundaryBanner } from "./insurance-boundary-banner";
import { InsuranceDocumentChecklist } from "./insurance-document-checklist";
import { InsuranceEducationCard } from "./insurance-education-card";

export function InsuranceMissionPage({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  const [policyType, setPolicyType] = useState("");
  const [preparingFor, setPreparingFor] = useState("");
  const [question, setQuestion] = useState("");

  async function save() {
    const headers = await getSupabaseRequestHeaders({ "Content-Type": "application/json", Accept: "application/json" });
    await fetch("/api/health-quest/insurance-mission", {
      method: "POST",
      headers,
      body: JSON.stringify({
        policyType,
        preparingFor,
        documents: ["policy_category", "receipts", "claim_form"],
        questions: question ? [question] : [],
      }),
    }).catch(() => undefined);
    toast.success(locale === "en" ? "Insurance checklist saved." : "保險問題清單已保存。");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-5">
        <Badge variant="secondary" className="mb-3">
          <ShieldCheck data-icon="inline-start" aria-hidden="true" />
          Insurance
        </Badge>
        <h1 className="text-3xl font-bold tracking-normal">{locale === "en" ? "Insurance Question Organizer" : "保險問題整理器"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {text(insuranceBoundary, locale)}
        </p>
      </section>
      <InsuranceBoundaryBanner locale={locale} />
      <div className="grid gap-3 rounded-3xl border border-border/60 bg-card/86 p-4">
        <Input value={policyType} onChange={(event) => setPolicyType(event.target.value)} placeholder={locale === "en" ? "Policy or benefit type" : "保單或福利類別"} />
        <Input value={preparingFor} onChange={(event) => setPreparingFor(event.target.value)} placeholder={locale === "en" ? "Event or question" : "準備處理的事件或問題"} />
        <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={locale === "en" ? "Question for insurer, broker, employer, or licensed adviser" : "想問保險公司、經紀、僱主或持牌顧問的問題"} />
      </div>
      <InsuranceDocumentChecklist locale={locale} />
      <InsuranceEducationCard locale={locale} />
      <Button type="button" className="min-h-12 rounded-2xl" onClick={save}>{locale === "en" ? "Save checklist" : "保存清單"}</Button>
    </div>
  );
}
