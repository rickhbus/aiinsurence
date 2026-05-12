"use client";

import { useEffect, useState } from "react";
import { Activity, Apple, BedDouble, Brain, Dumbbell, Droplets, Moon, Toilet, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDailyHealthSummary } from "@/lib/health-os/daily-summary";
import type { DailyHealthSummary } from "@/lib/health-os/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { CheckInForm } from "./check-in-form";
import { DailySummaryCard } from "./daily-summary-card";
import { HealthScoreCard, SafetyStatusCard } from "./health-score-card";
import { NextActionsCard } from "./next-actions-card";
import { SafetyAlert } from "./safety-alert";

const fallbackSummary = buildDailyHealthSummary({
  locale: "zh-Hant",
  dailyLog: {
    sleepMinutes: 360,
    sleepQuality: 6,
    energyScore: 6,
    moodScore: 6,
    stressScore: 6,
  },
  meals: [{ proteinG: 20, fiberG: 4, waterMl: 300 }],
  hydrationLogs: [{ waterMl: 800, caffeineMg: 120 }],
  toiletLogs: [{ bowelMovement: true, stoolType: 4, urineColor: "yellow" }],
  gymWorkouts: [{ durationMinutes: 0, intensity: 4 }],
});

export function AdvancedTodayDashboard() {
  const [summary, setSummary] = useState<DailyHealthSummary>(fallbackSummary);
  const [mode, setMode] = useState<"local" | "real" | "loading">("loading");
  const [supabase] = useState(() => getSupabaseBrowserClient());

  useEffect(() => {
    let active = true;

    async function loadToday() {
      if (!supabase) {
        setMode("local");
        return;
      }

      try {
        const current = await supabase.auth.getSession();
        const token = current.data.session?.access_token ?? (await supabase.auth.signInAnonymously()).data.session?.access_token;

        if (!token) {
          setMode("local");
          return;
        }

        const response = await fetch("/api/daily-health/today", {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const body = await response.json().catch(() => null);

        if (active && response.ok && body?.summary) {
          setSummary(body.summary);
          setMode("real");
        } else if (active) {
          setMode("local");
        }
      } catch {
        if (active) {
          setMode("local");
        }
      }
    }

    loadToday();
    window.addEventListener("health-log-saved", loadToday);

    return () => {
      active = false;
      window.removeEventListener("health-log-saved", loadToday);
    };
  }, [supabase]);

  return (
    <div className="flex flex-col gap-6">
      <section className="welcome-gradient rounded-2xl border border-border/50 bg-card/70 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">Super Family Doctor / 智健家庭醫生</Badge>
            <h1 className="text-gradient-health text-3xl font-bold tracking-normal sm:text-4xl">今日狀態 / Today</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              我可以幫你整理今日身體、情緒、飲食、運動和睡眠狀態，並提供一般生活建議。這不是醫療診斷。
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/check-in">快速 check-in / Quick check-in</a>
          </Button>
        </div>
      </section>

      {summary.safetyStatus === "red" ? <SafetyAlert status="red" /> : null}
      {mode === "local" ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-muted-foreground">
          目前顯示本機示範摘要；登入或匿名 session 啟動後會載入受 RLS 保護的真實紀錄。
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HealthScoreCard title="能量 / Energy" value={summary.energyScore} helper="睡眠、心情、壓力和主觀能量的生活狀態參考。" icon={Moon} />
        <HealthScoreCard title="恢復 / Recovery" value={summary.recoveryScore} helper="睡眠、酸痛、訓練強度和痛楚旗標。" icon={BedDouble} />
        <HealthScoreCard title="營養 / Nutrition" value={summary.nutritionScore} helper="蛋白質、纖維、水分和高糖/高鈉旗標。" icon={Apple} />
        <SafetyStatusCard status={summary.safetyStatus} />
        <HealthScoreCard title="壓力 / Stress" value={summary.stressScore} helper="分數越高代表壓力負荷較低。" icon={Brain} />
        <HealthScoreCard title="補水 / Hydration" value="Quick log" helper="水、咖啡因和酒精都會影響睡眠和恢復。" icon={Droplets} />
        <HealthScoreCard title="腸胃 / Digestion" value={summary.digestiveScore} helper="大便、尿色、痛楚和血尿/血便旗標。" icon={Toilet} />
        <HealthScoreCard title="活動 / Movement" value={summary.movementScore} helper="步數、運動、健身和活動分鐘。" icon={Activity} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <DailySummaryCard summary={summary} />
        <NextActionsCard actions={summary.nextActions} />
      </section>

      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle>快速記錄 / Fast logging</CardTitle>
          <CardDescription>一隻手可完成日常身體、心情、飲食、補水、腸胃和健身紀錄。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["/check-in", "Wake-up", Waves],
            ["/mood", "Mood", Brain],
            ["/food", "Food", Apple],
            ["/hydration", "Hydration", Droplets],
            ["/toilet", "Toilet", Toilet],
            ["/gym", "Gym", Dumbbell],
          ].map(([href, label, Icon]) => (
            <Button key={String(href)} asChild variant="outline" className="h-12 justify-start">
              <a href={String(href)}>
                <Icon data-icon="inline-start" aria-hidden="true" />
                {String(label)}
              </a>
            </Button>
          ))}
        </CardContent>
      </Card>

      <CheckInForm compact />
    </div>
  );
}
