"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Apple, BedDouble, BookOpenCheck, Brain, ChevronRight, Droplets, Dumbbell, ShieldCheck, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

const lessons = [
  {
    slug: "hydration-basics",
    icon: Droplets,
    title: { zh: "補水基礎", en: "Hydration basics" },
    body: { zh: "用尿色、天氣和出汗量作一般生活參考。", en: "Use urine color, weather, and sweating as general lifestyle cues." },
  },
  {
    slug: "sleep-basics",
    icon: BedDouble,
    title: { zh: "睡眠基礎", en: "Sleep basics" },
    body: { zh: "固定睡前小流程，比追求完美睡眠更容易持續。", en: "A small wind-down routine is easier to sustain than perfect sleep." },
  },
  {
    slug: "stress-reset",
    icon: Brain,
    title: { zh: "壓力重置", en: "Stress reset" },
    body: { zh: "用 60 秒呼吸或步行作生活支援，不是心理診斷。", en: "Use a 60-second breath or walk as lifestyle support, not a diagnosis." },
  },
  {
    slug: "balanced-meal",
    icon: Apple,
    title: { zh: "均衡一餐", en: "Balanced meal basics" },
    body: { zh: "先想蛋白質、蔬菜、水分，再按需要加主食。", en: "Think protein, vegetables, and water first, then add carbs as needed." },
  },
  {
    slug: "movement-basics",
    icon: Dumbbell,
    title: { zh: "郁動基礎", en: "Movement basics" },
    body: { zh: "低能量日可以做輕量版本；恢復都算數。", en: "Low-energy days can use the gentle version. Recovery counts." },
  },
  {
    slug: "doctor-visit-prep",
    icon: Stethoscope,
    title: { zh: "就診準備", en: "Doctor visit preparation" },
    body: { zh: "整理開始時間、變化、問題和文件，幫醫生更快理解。", en: "Prepare timing, changes, questions, and documents for the visit." },
  },
  {
    slug: "insurance-education",
    icon: ShieldCheck,
    title: { zh: "保險教育", en: "Insurance education only" },
    body: { zh: "學習文件和問題清單，不作承保、定價或索償決定。", en: "Learn document and question checklists, not eligibility, pricing, or claims decisions." },
  },
];

export function HealthQuestLearnPage({ locale }: { locale: QuestLocale }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  async function completeLesson(slug: string) {
    setSaving(slug);

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      await fetch("/api/health-quest/learn", {
        method: "POST",
        headers,
        body: JSON.stringify({ lessonSlug: slug }),
      });
    } catch {
      // The lesson still counts visually in local/demo mode; the API path is privacy-safe when auth is available.
    } finally {
      setSaving(null);
      setCompleted((current) => Array.from(new Set([...current, slug])));
      toast.success("+5 XP", {
        description: locale === "zh-Hant" ? "完成一分鐘健康小課。" : "Tiny health lesson complete.",
      });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <section className="rounded-3xl border border-border/50 bg-card/72 p-5 shadow-sm backdrop-blur-xl sm:p-6">
        <Badge variant="secondary" className="mb-3">Health Quest / Learn</Badge>
        <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">
          {locale === "zh-Hant" ? "一分鐘健康小課" : "Tiny Health Lessons"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {locale === "zh-Hant"
            ? "短、實用、一般生活教育。不是診斷、治療或保險建議。"
            : "Short, practical general education. Not diagnosis, treatment, or insurance advice."}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lessons.map((lesson) => {
          const done = completed.includes(lesson.slug);

          return (
            <Card key={lesson.slug} className="border-border/60 bg-card/86 shadow-sm">
              <CardHeader>
                <Badge variant={done ? "default" : "secondary"} className="w-fit">
                  {done ? "Done" : "+5 XP"}
                </Badge>
                <lesson.icon aria-hidden="true" className="text-primary" />
                <CardTitle>{locale === "zh-Hant" ? lesson.title.zh : lesson.title.en}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {locale === "zh-Hant" ? lesson.body.zh : lesson.body.en}
              </CardContent>
              <CardFooter className="justify-between gap-2">
                <Button type="button" variant={done ? "secondary" : "default"} disabled={done || saving === lesson.slug} onClick={() => void completeLesson(lesson.slug)}>
                  <BookOpenCheck data-icon="inline-start" aria-hidden="true" />
                  {saving === lesson.slug
                    ? (locale === "zh-Hant" ? "保存中" : "Saving")
                    : done ? (locale === "zh-Hant" ? "已完成" : "Completed") : (locale === "zh-Hant" ? "完成小課" : "Complete")}
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/learn/${lesson.slug}`}>
                    {locale === "zh-Hant" ? "詳情" : "Open"}
                    <ChevronRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
