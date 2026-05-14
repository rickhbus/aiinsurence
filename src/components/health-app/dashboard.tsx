"use client";

import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/health-data/types";
import { label, ui } from "@/lib/health-app/i18n";
import type { Locale } from "@/lib/health-app/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ActivitySummaryCard,
  AIGblCard,
  AIRecommendationCard,
  EmotionEngineCard,
  EverydayActionsCard,
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

type DashboardMode =
  | "loading"
  | "real"
  | "config-unavailable"
  | "auth-unavailable"
  | "unavailable";

export function DashboardPage({ locale }: { locale: Locale }) {
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>("loading");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!supabase) {
        if (active) {
          setDashboardMode("config-unavailable");
        }
        return;
      }

      const accessToken = await getDashboardAccessToken(supabase);

      if (!accessToken) {
        if (active) {
          setDashboardMode("auth-unavailable");
        }
        return;
      }

      try {
        const headers = new Headers({ Accept: "application/json" });
        headers.set("Authorization", `Bearer ${accessToken}`);

        const response = await fetch("/api/dashboard", {
          headers,
        });

        if (!response.ok) {
          if (active) {
            setDashboardMode(getDashboardErrorMode(response.status));
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
          setDashboardMode("unavailable");
        }
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
  }, [supabase]);

  const fallbackCopy = getDashboardFallbackCopy(dashboardMode, locale);

  return (
    <div className="flex flex-col gap-6">
      <WelcomeStrip locale={locale} data={dashboardData} />

      {dashboardData?.empty ? (
        <div className="play-island-card rounded-[1.35rem] p-5 text-sm leading-6 text-muted-foreground">
          {locale === "zh-Hant"
            ? "開始記錄你的第一個健康行動，建立個人化建議。"
            : "Start logging your first health action to build personalized recommendations."}
        </div>
      ) : null}

      {fallbackCopy ? (
        <div className="rounded-[1.35rem] border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-muted-foreground" role="status">
          {fallbackCopy}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-12" aria-label={label(ui.dashboard, locale)}>
        <HealthScoreCard locale={locale} data={dashboardData} className="xl:col-span-5" />
        <TodayPlanCard locale={locale} data={dashboardData} className="xl:col-span-7" />
        <EverydayActionsCard locale={locale} data={dashboardData} className="md:col-span-2 xl:col-span-12" />

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
        <AIGblCard locale={locale} className="xl:col-span-6" />
        <EmotionEngineCard locale={locale} className="xl:col-span-6" />
      </section>

      <SafetyDisclaimer locale={locale} />
    </div>
  );
}

async function getDashboardAccessToken(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
) {
  try {
    const currentSession = await supabase.auth.getSession();
    const existingToken = currentSession.data.session?.access_token;

    if (existingToken) {
      return existingToken;
    }

    const anonymousSession = await supabase.auth.signInAnonymously();

    return anonymousSession.data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

function getDashboardErrorMode(status: number): DashboardMode {
  if (status === 503) {
    return "config-unavailable";
  }

  if (status === 401 || status === 403) {
    return "auth-unavailable";
  }

  return "unavailable";
}

function getDashboardFallbackCopy(mode: DashboardMode, locale: Locale) {
  if (mode === "config-unavailable") {
    return locale === "zh-Hant"
      ? "Supabase 尚未設定，儀表板只會顯示空狀態。設定完成後會載入真實紀錄。"
      : "Supabase is not configured, so the dashboard will show empty states. Real records load after setup.";
  }

  if (mode === "auth-unavailable") {
    return locale === "zh-Hant"
      ? "匿名模式暫時未能啟動，儀表板未能載入真實紀錄。"
      : "Anonymous mode could not start, so real dashboard records are not loaded.";
  }

  if (mode === "unavailable") {
    return locale === "zh-Hant"
      ? "暫時未能載入真實紀錄；請稍後再試。"
      : "Real records are temporarily unavailable. Please try again later.";
  }

  return null;
}
