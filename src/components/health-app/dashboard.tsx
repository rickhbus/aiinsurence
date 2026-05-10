"use client";

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
  return (
    <div className="flex flex-col gap-5">
      <WelcomeStrip locale={locale} />

      <section className="grid gap-5 xl:grid-cols-12" aria-label={label(ui.dashboard, locale)}>
        <HealthScoreCard locale={locale} className="xl:col-span-5" />
        <TodayPlanCard locale={locale} className="xl:col-span-7" />

        <AIRecommendationCard locale={locale} className="md:col-span-2 xl:col-span-4" />
        <ActivitySummaryCard locale={locale} className="md:col-span-2 xl:col-span-8" />

        <RunningProgressCard locale={locale} className="xl:col-span-4" />
        <GymProgressCard locale={locale} className="xl:col-span-4" />
        <NutritionCard locale={locale} className="xl:col-span-4" />

        <SleepCard locale={locale} className="xl:col-span-4" />
        <WaterCard locale={locale} className="xl:col-span-4" />
        <LearnCard locale={locale} className="xl:col-span-4" />

        <HealthcareReminderCard locale={locale} className="xl:col-span-6" />
        <WeeklyProgressCard locale={locale} className="xl:col-span-6" />
      </section>

      <SafetyDisclaimer locale={locale} />
    </div>
  );
}
