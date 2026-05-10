"use client";

import { useState } from "react";
import type { HealthPage, Locale } from "@/lib/health-app/types";
import { cn } from "@/lib/utils";
import { CoachPage, RightCoachPanel } from "./coach";
import { DashboardPage } from "./dashboard";
import { HealthcarePage, InsurancePage, LearnPage, LessonPage } from "./knowledge-healthcare";
import { MobileBottomNav, QuickAddButton, Sidebar, TopHeader } from "./navigation";
import {
  AuthLandingPage,
  GoalsPage,
  MemoryPage,
  ProfilePage,
  ProgressPage,
  SettingsPage,
} from "./profile-progress";
import {
  GenericTrackerPage,
  GymPage,
  NutritionPage,
  RunningPage,
  TrackOverviewPage,
} from "./trackers";

export function HealthAppShell({
  currentPage = "dashboard",
  lessonSlug,
}: {
  currentPage?: HealthPage;
  lessonSlug?: string;
}) {
  const [locale, setLocale] = useState<Locale>("zh-Hant");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [coachOpen, setCoachOpen] = useState(true);
  const showRightCoach = currentPage !== "coach" && currentPage !== "auth";

  return (
    <div className="min-h-dvh bg-[linear-gradient(135deg,var(--health-bg-start),var(--background)_46%,var(--health-bg-end))]">
      <div className="flex min-h-dvh">
        <Sidebar
          currentPage={currentPage}
          locale={locale}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader
            currentPage={currentPage}
            locale={locale}
            setLocale={setLocale}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={() => setSidebarCollapsed((current) => !current)}
            coachOpen={coachOpen}
            onCoachToggle={() => setCoachOpen((current) => !current)}
            showCoachToggle={showRightCoach}
          />
          <main
            className={cn(
              "mx-auto w-full flex-1 px-4 pb-28 pt-5 lg:px-6 lg:pb-8",
              showRightCoach && coachOpen ? "xl:max-w-[1180px]" : "xl:max-w-[1360px]",
            )}
          >
            <PageContent currentPage={currentPage} lessonSlug={lessonSlug} locale={locale} />
          </main>
        </div>
        {showRightCoach && coachOpen ? <RightCoachPanel locale={locale} onClose={() => setCoachOpen(false)} /> : null}
        <MobileBottomNav currentPage={currentPage} locale={locale} />
        <QuickAddButton locale={locale} />
      </div>
    </div>
  );
}

function PageContent({
  currentPage,
  lessonSlug,
  locale,
}: {
  currentPage: HealthPage;
  lessonSlug?: string;
  locale: Locale;
}) {
  switch (currentPage) {
    case "dashboard":
      return <DashboardPage locale={locale} />;
    case "coach":
      return <CoachPage locale={locale} />;
    case "track":
      return <TrackOverviewPage locale={locale} />;
    case "running":
      return <RunningPage locale={locale} />;
    case "gym":
      return <GymPage locale={locale} />;
    case "nutrition":
      return <NutritionPage locale={locale} />;
    case "learn":
      return <LearnPage locale={locale} />;
    case "lesson":
      return <LessonPage locale={locale} slug={lessonSlug} />;
    case "healthcare":
    case "symptom-routing":
      return <HealthcarePage locale={locale} />;
    case "insurance":
      return <InsurancePage locale={locale} />;
    case "progress":
      return <ProgressPage locale={locale} />;
    case "goals":
      return <GoalsPage locale={locale} />;
    case "profile":
      return <ProfilePage locale={locale} />;
    case "memory":
      return <MemoryPage locale={locale} />;
    case "settings":
      return <SettingsPage locale={locale} />;
    case "auth":
      return <AuthLandingPage locale={locale} />;
    case "walking":
    case "sports":
    case "body":
    case "sleep":
    case "water":
    case "food-log":
    case "diet-plan":
      return <GenericTrackerPage page={currentPage} locale={locale} />;
    default:
      return <DashboardPage locale={locale} />;
  }
}
