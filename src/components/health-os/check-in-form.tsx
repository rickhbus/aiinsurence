"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DailyHealthSummary } from "@/lib/health-os/types";
import { useHealthOsSubmit } from "./client-submit";
import { DailySummaryCard } from "./daily-summary-card";

export function CheckInForm({ compact = false }: { compact?: boolean }) {
  const { saving, submit } = useHealthOsSubmit();
  const [summary, setSummary] = useState<DailyHealthSummary | null>(null);
  const [consentToSave, setConsentToSave] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = await submit({
      endpoint: "/api/daily-health/check-in",
      payload: {
        wakeTime: dateTimeOrUndefined(formData.get("wakeTime")),
        sleepMinutes: numberOrUndefined(formData.get("sleepMinutes")),
        sleepQuality: numberOrUndefined(formData.get("sleepQuality")),
        energyScore: numberOrUndefined(formData.get("energyScore")),
        moodScore: numberOrUndefined(formData.get("moodScore")),
        stressScore: numberOrUndefined(formData.get("stressScore")),
        bodyNotes: stringValue(formData.get("bodyNotes")),
        todayGoal: stringValue(formData.get("todayGoal")),
        consentToSave,
      },
      successZh: consentToSave ? "已保存今日 check-in。" : "已生成本機今日摘要。",
    });

    if (body?.summary) {
      setSummary(body.summary);
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sunrise aria-hidden="true" />
            </span>
            <CardTitle>我今日起身啦 / Wake-up check-in</CardTitle>
            <CardDescription>
              記錄睡眠、能量、情緒、壓力和今日一個目標。保存只在你同意並有 Supabase session 時發生。
            </CardDescription>
          </CardHeader>
          <CardContent className={compact ? "grid gap-3" : "grid gap-3 md:grid-cols-2"}>
            <Field name="wakeTime" label="起床時間 / Wake time" type="datetime-local" />
            <Field name="sleepMinutes" label="睡眠分鐘 / Sleep minutes" type="number" placeholder="420" />
            <Field name="sleepQuality" label="睡眠質素 1-10 / Sleep quality" type="number" placeholder="7" />
            <Field name="energyScore" label="能量 1-10 / Energy" type="number" placeholder="6" />
            <Field name="moodScore" label="心情 1-10 / Mood" type="number" placeholder="6" />
            <Field name="stressScore" label="壓力 1-10 / Stress" type="number" placeholder="4" />
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              身體不適 / Body discomfort
              <Textarea name="bodyNotes" placeholder="例如：肩頸緊、胃有少少脹。" maxLength={1000} />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              今日主要目標 / Today’s main goal
              <Input name="todayGoal" placeholder="例如：飲夠水，做 20 分鐘步行。" maxLength={240} />
            </label>
            <label className="flex items-start gap-2 rounded-xl bg-muted/30 p-3 text-sm leading-6 text-muted-foreground md:col-span-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={consentToSave}
                onChange={(event) => setConsentToSave(event.target.checked)}
              />
              <span>同意保存到受 RLS 保護的 Supabase 紀錄 / Save to RLS-protected Supabase record</span>
            </label>
          </CardContent>
          <CardFooter>
            <Button disabled={saving}>{saving ? "整理中 / Saving" : "完成 check-in / Save check-in"}</Button>
          </CardFooter>
        </form>
      </Card>
      {summary ? <DailySummaryCard summary={summary} /> : null}
    </div>
  );
}

function Field({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input name={name} type={type} placeholder={placeholder} inputMode={type === "number" ? "decimal" : undefined} />
    </label>
  );
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrUndefined(value: FormDataEntryValue | null) {
  const number = Number(stringValue(value));

  return Number.isFinite(number) && stringValue(value) !== "" ? number : undefined;
}

function dateTimeOrUndefined(value: FormDataEntryValue | null) {
  const text = stringValue(value);

  return text ? new Date(text).toISOString() : undefined;
}
