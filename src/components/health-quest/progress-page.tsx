"use client";

import { useEffect, useState } from "react";
import { BarChart3, Droplets, Dumbbell, Flame, Smile, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressChart } from "@/components/health-app/charts";
import { text } from "@/lib/health-quest/copy";
import type { QuestLocale, QuestProgressSummary } from "@/lib/health-quest/types";
import { buildQuestProgressSummary } from "@/lib/health-quest/progress";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { WeeklyReviewCard } from "./weekly-review-card";

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
      <section className="rounded-3xl border border-border/50 bg-card/72 p-5 shadow-sm backdrop-blur-xl sm:p-6">
        <Badge variant="secondary" className="mb-3">Health Quest / 進度</Badge>
        <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">
          {locale === "zh-Hant" ? "健康任務進度" : "Health Quest Progress"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {locale === "zh-Hant"
            ? "只顯示私隱安全的完成趨勢，不顯示原始症狀、心情文字或私人備註。"
            : "Shows privacy-safe completion trends only, not raw symptoms, mood text, or private notes."}
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Flame} label="Streak" value={`${progress.currentStreak}`} detail="current days" />
        <MetricCard icon={Sparkles} label="Week XP" value={`${progress.xpThisWeek}`} detail="completion XP" />
        <MetricCard icon={BarChart3} label="30d XP" value={`${progress.xpLast30Days}`} detail="privacy-safe total" />
        <MetricCard icon={Flame} label="Best" value={`${progress.longestStreak}`} detail="longest streak" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="border-border/60 bg-card/82 shadow-sm">
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

      <Card className="border-border/60 bg-card/82 shadow-sm">
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
    <Card className="border-border/60 bg-card/86 shadow-sm">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon aria-hidden="true" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-normal">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
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
    <Card className="border-border/60 bg-card/82 shadow-sm">
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
