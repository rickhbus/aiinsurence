"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MoodAnalysis } from "@/lib/health-os/types";
import { useHealthOsSubmit } from "@/components/health-os/client-submit";
import { EmotionReflectionCard } from "./emotion-reflection-card";

export function MoodCheckInForm() {
  const { saving, submit } = useHealthOsSubmit();
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null);
  const [triggerCategory, setTriggerCategory] = useState("unknown");
  const [bodyLink, setBodyLink] = useState("poor_sleep");
  const [consentToSave, setConsentToSave] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = await submit({
      endpoint: consentToSave ? "/api/mood/log" : "/api/mood/analyze",
      payload: {
        moodScore: numberValue(data.get("moodScore")),
        stressScore: numberValue(data.get("stressScore")),
        energyScore: numberValue(data.get("energyScore")),
        emotionLabel: stringValue(data.get("emotionLabel")) || undefined,
        triggerCategory,
        bodyLinks: [bodyLink],
        userText: stringValue(data.get("userText")),
        consentToSave,
        language: "zh-Hant",
      },
      successZh: consentToSave ? "已保存情緒紀錄。" : "已生成情緒反映。",
    });

    if (body?.analysis) {
      setAnalysis(body.analysis);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Brain aria-hidden="true" />
            </span>
            <CardTitle>Mood & Emotion Coach</CardTitle>
            <CardDescription>情緒只用作同理和清晰度支援，不診斷心理健康狀況。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Field name="moodScore" label="心情 1-10" placeholder="6" />
            <Field name="stressScore" label="壓力 1-10" placeholder="7" />
            <Field name="energyScore" label="能量 1-10" placeholder="5" />
            <label className="grid gap-2 text-sm font-medium">
              情緒標籤
              <Input name="emotionLabel" placeholder="stressed / tired / anxious" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              觸發類別
              <Select value={triggerCategory} onValueChange={setTriggerCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["work", "family", "money", "health", "relationship", "study", "sleep", "body_image", "unknown"].map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              身體連結
              <Select value={bodyLink} onValueChange={setBodyLink}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["poor_sleep", "low_food", "high_caffeine", "low_movement", "heavy_workout", "pain", "dehydration"].map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-3">
              文字或語音轉文字 / Text or voice-style entry
              <Textarea name="userText" maxLength={2000} placeholder="你的訊息聽起來像是……" />
            </label>
            <label className="flex items-start gap-2 rounded-xl bg-muted/30 p-3 text-sm leading-6 text-muted-foreground md:col-span-3">
              <input type="checkbox" className="mt-1" checked={consentToSave} onChange={(event) => setConsentToSave(event.target.checked)} />
              <span>同意保存結構化 mood log / Save structured mood log</span>
            </label>
          </CardContent>
          <CardFooter>
            <Button disabled={saving}>{saving ? "分析中" : "分析 mood / Analyze mood"}</Button>
          </CardFooter>
        </form>
      </Card>
      <EmotionReflectionCard analysis={analysis} />
    </div>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input name={name} type="number" inputMode="numeric" placeholder={placeholder} min={1} max={10} />
    </label>
  );
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: FormDataEntryValue | null) {
  const number = Number(stringValue(value));

  return Number.isFinite(number) ? number : undefined;
}
