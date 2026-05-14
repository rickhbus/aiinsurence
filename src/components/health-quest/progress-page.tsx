"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Droplets, Dumbbell, Flame, HeartPulse, Smile, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressChart } from "@/components/health-app/charts";
import { text } from "@/lib/health-quest/copy";
import { turtleCoachIdentity } from "@/lib/health-quest/play-system";
import type { QuestLocale, QuestProgressSummary } from "@/lib/health-quest/types";
import { buildQuestProgressSummary } from "@/lib/health-quest/progress";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { WeeklyReviewCard } from "./weekly-review-card";
import { PlayBadge } from "./play/play-badge";
import { PlayCard } from "./play/play-card";
import { PlayMascotPlaceholder } from "./play/play-mascot-placeholder";

type ProgressResponse = {
  progress?: QuestProgressSummary;
};

const fallbackProgress = buildQuestProgressSummary({
  quests: [],
  xpEvents: [],
  currentStreak: 0,
  longestStreak: 0,
});

export function HealthQuestProgressPage({ locale }: { locale: QuestLocale }) {
  const [progress, setProgress] = useState<QuestProgressSummary>(fallbackProgress);

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      try {
        const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
        const response = await fetch("/api/health-quest/progress", { headers });
        const body = (await response.json().catch(() => null)) as ProgressResponse | null;

        if (active && response.ok && body?.progress) {
          setProgress(body.progress);
        }
      } catch {
        if (active) {
          setProgress(fallbackProgress);
        }
      }
    }

    void loadProgress();

    return () => {
      active = false;
    };
  }, []);

  const chartData = [
    { label: "Water", value: progress.hydrationConsistency },
    { label: "Move", value: progress.movementConsistency },
    { label: "Mood", value: progress.moodConsistency },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <section className="play-island-card rounded-[1.8rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PlayBadge tone="primary">{locale === "zh-Hant" ? "任務進度" : "Quest progress"}</PlayBadge>
            <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
              {locale === "zh-Hant" ? "健康任務進度" : "Health Quest Progress"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {locale === "zh-Hant"
                ? "只顯示私隱安全的完成趨勢，不顯示原始症狀、心情文字或私人備註。"
                : "Shows privacy-safe completion trends only, not raw symptoms, mood text, or private notes."}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-[1.4rem] border border-teal-500/20 bg-teal-500/10 p-3">
            <PlayMascotPlaceholder mood="celebrating" size="md" />
            <div>
              <p className="text-sm font-black">{locale === "zh-Hant" ? turtleCoachIdentity.mascot.zh : turtleCoachIdentity.mascot.en}</p>
              <p className="text-xs text-muted-foreground">{locale === "zh-Hant" ? "只獎勵小步，不判斷健康價值。" : "Tiny steps only, never health worth."}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Flame} label="Streak" value={`${progress.currentStreak}`} detail="current days" />
        <MetricCard icon={Sparkles} label="Week XP" value={`${progress.xpThisWeek}`} detail="completion XP" />
        <MetricCard icon={HeartPulse} label="Active" value={`${progress.activeDays}`} detail="active days" />
        <MetricCard icon={BookOpenCheck} label="Lessons" value={`${progress.lessonsCompleted}`} detail="completed" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="play-island-card rounded-[1.5rem] border-0">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "一致性" : "Consistency"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={chartData} />
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <ConsistencyCard icon={Droplets} label="Hydration" value={progress.hydrationConsistency} />
          <ConsistencyCard icon={Dumbbell} label="Movement" value={progress.movementConsistency} />
          <ConsistencyCard icon={Smile} label="Mood" value={progress.moodConsistency} />
        </div>
      </div>

      <WeeklyReviewCard locale={locale} />

      <Button asChild className="play-pressable w-fit rounded-2xl font-black">
        <Link href={progress.weeklyReviewHref}>{locale === "zh-Hant" ? "開啟一週健康回顧" : "Open weekly review"}</Link>
      </Button>

      <Card className="play-island-card rounded-[1.5rem] border-0">
        <CardContent className="pt-4 text-sm leading-6 text-muted-foreground">
          {text(progress.weeklyReview, locale)}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <PlayCard className="grid gap-2">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon aria-hidden="true" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-3xl font-black tracking-normal">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </PlayCard>
  );
}

function ConsistencyCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Droplets;
  label: string;
  value: number;
}) {
  return (
    <Card className="play-island-card rounded-[1.35rem] border-0">
      <CardContent className="flex items-center justify-between gap-3 pt-4">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon aria-hidden="true" />
          {label}
        </span>
        <Badge variant="secondary">{value}%</Badge>
      </CardContent>
    </Card>
  );
}
