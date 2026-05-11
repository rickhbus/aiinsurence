"use client";

import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/health-data/types";
import { label, ui } from "@/lib/health-app/i18n";
import type { Locale } from "@/lib/health-app/types";
import {
  ActivitySummaryCard,
  AIRecommendationCard,
  GymProgressCard,
  HealthcareReminderCard,
  HealthScoreCard,
  LearnCard,
  NutritionCard,
  RunningProgressCard,
  SafetyDisclaimer,
  SleepCard,
  TodayPlanCard,
  WaterCard,
  WeeklyProgressCard,
} from "./dashboard-cards";
import { WelcomeStrip } from "./navigation";

export function DashboardPage({ locale }: { locale: Locale }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardMode, setDashboardMode] = useState<"loading" | "real" | "demo">("loading");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          if (active) {
            setDashboardMode("demo");
          }
          return;
        }

        const data = (await response.json()) as DashboardData;

        if (active) {
          setDashboardData(data);
          setDashboardMode("real");
        }
      } catch {
        if (active) {
          setDashboardMode("demo");
        }
        // Local development without Supabase keeps the mock dashboard visible.
      }
    }

    loadDashboard();

    function refreshDashboard() {
      loadDashboard();
    }

    window.addEventListener("health-log-saved", refreshDashboard);

    return () => {
      active = false;
      window.removeEventListener("health-log-saved", refreshDashboard);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <WelcomeStrip locale={locale} data={dashboardData} />

      {dashboardData?.empty ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 p-5 text-sm leading-6 text-muted-foreground shadow-sm backdrop-blur-sm">
          {locale === "zh-Hant"
            ? "開始記錄你的第一個健康行動，建立個人化建議。"
            : "Start logging your first health action to build personalized recommendations."}
        </div>
      ) : null}

      {dashboardMode === "demo" ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-muted-foreground">
          {locale === "zh-Hant"
            ? "目前顯示本機示範資料。設定 Supabase 後，儀表板會載入你的真實紀錄。"
            : "Showing local demo data. Configure Supabase to load your real dashboard records."}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-12" aria-label={label(ui.dashboard, locale)}>
        <HealthScoreCard locale={locale} data={dashboardData} className="xl:col-span-5" />
        <TodayPlanCard locale={locale} data={dashboardData} className="xl:col-span-7" />

        <AIRecommendationCard locale={locale} data={dashboardData} className="md:col-span-2 xl:col-span-4" />
        <ActivitySummaryCard locale={locale} data={dashboardData} className="md:col-span-2 xl:col-span-8" />

        <RunningProgressCard locale={locale} data={dashboardData} className="xl:col-span-4" />
        <GymProgressCard locale={locale} data={dashboardData} className="xl:col-span-4" />
        <NutritionCard locale={locale} data={dashboardData} className="xl:col-span-4" />

        <SleepCard locale={locale} data={dashboardData} className="xl:col-span-4" />
        <WaterCard locale={locale} data={dashboardData} className="xl:col-span-4" />
        <LearnCard locale={locale} className="xl:col-span-4" />

        <HealthcareReminderCard locale={locale} className="xl:col-span-6" />
        <WeeklyProgressCard locale={locale} data={dashboardData} className="xl:col-span-6" />
      </section>

      <SafetyDisclaimer locale={locale} />
    </div>
  );
}
