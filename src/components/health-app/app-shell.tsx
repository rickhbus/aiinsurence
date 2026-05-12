"use client";

import { useState } from "react";
import type { HealthPage, Locale } from "@/lib/health-app/types";
import { cn } from "@/lib/utils";
import { CoachPage, RightCoachPanel } from "./coach";
import { DashboardPage } from "./dashboard";
import { EmotionEnginePage, GblPage, HistoryPage } from "./intelligence";
import { HealthcarePage, LearnPage, LessonPage } from "./knowledge-healthcare";
import { MobileBottomNav, QuickAddButton, Sidebar, TopHeader } from "./navigation";
import {
  AuthLandingPage,
  GoalsPage,
  MemoryPage,
  ProfilePage,
  ProgressPage,
  SettingsPage,
} from "./profile-progress";
import { OnboardingPage } from "./onboarding";
import {
  GenericTrackerPage,
  NutritionPage,
  RunningPage,
  TrackOverviewPage,
} from "./trackers";
import {
  BusinessPage,
  CheckInPage,
  DoctorPrepPage,
  FamilyPage,
  FoodPage,
  GymPage as HealthOsGymPage,
  GymTemplatesPage,
  HealthOsLanding,
  HydrationPage,
  InsurancePrepPage,
  MoodPage,
  PricingPage,
  ReportsPage,
  TodayPage,
  ToiletPage,
} from "@/components/health-os/mvp-pages";

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
  const isFocusedPage = currentPage === "auth" || currentPage === "onboarding";
  const showRightCoach = currentPage !== "coach" && !isFocusedPage;

  return (
    <div className="min-h-dvh overflow-x-clip bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_40%,var(--health-bg-end)_90%,var(--background))]">
      <div className="flex min-h-dvh">
        {!isFocusedPage ? (
          <Sidebar
            currentPage={currentPage}
            locale={locale}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          {!isFocusedPage ? (
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
          ) : null}
          <main
            className={cn(
              "mx-auto w-full min-w-0 flex-1 px-4 sm:px-5 lg:px-8",
              isFocusedPage
                ? "pb-10 pt-4 sm:pt-8 xl:max-w-[1120px]"
                : "pb-[calc(7.5rem_+_env(safe-area-inset-bottom))] pt-6 lg:pb-10",
              !isFocusedPage ? (showRightCoach && coachOpen ? "xl:max-w-[1180px]" : "xl:max-w-[1360px]") : null,
            )}
          >
            <PageContent currentPage={currentPage} lessonSlug={lessonSlug} locale={locale} />
          </main>
        </div>
        {showRightCoach && coachOpen ? <RightCoachPanel locale={locale} onClose={() => setCoachOpen(false)} /> : null}
        {!isFocusedPage ? <MobileBottomNav currentPage={currentPage} locale={locale} /> : null}
        {!isFocusedPage ? <QuickAddButton locale={locale} /> : null}
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
    case "landing":
      return <HealthOsLanding />;
    case "today":
      return <TodayPage />;
    case "check-in":
      return <CheckInPage />;
    case "mood":
      return <MoodPage />;
    case "food":
      return <FoodPage />;
    case "hydration":
      return <HydrationPage />;
    case "toilet":
      return <ToiletPage />;
    case "gym-templates":
      return <GymTemplatesPage />;
    case "reports":
      return <ReportsPage />;
    case "family":
      return <FamilyPage />;
    case "doctor":
      return <DoctorPrepPage />;
    case "pricing":
      return <PricingPage />;
    case "business":
      return <BusinessPage />;
    case "dashboard":
      return <DashboardPage locale={locale} />;
    case "coach":
      return <CoachPage locale={locale} />;
    case "track":
      return <TrackOverviewPage locale={locale} />;
    case "running":
      return <RunningPage locale={locale} />;
    case "gym":
      return <HealthOsGymPage />;
    case "nutrition":
    case "food-log":
      return <NutritionPage locale={locale} />;
    case "learn":
      return <LearnPage locale={locale} />;
    case "lesson":
      return <LessonPage locale={locale} slug={lessonSlug} />;
    case "gbl":
      return <GblPage locale={locale} />;
    case "emotion":
      return <EmotionEnginePage locale={locale} />;
    case "history":
      return <HistoryPage locale={locale} />;
    case "healthcare":
    case "symptom-routing":
      return <HealthcarePage locale={locale} />;
    case "insurance":
      return <InsurancePrepPage />;
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
    case "onboarding":
      return <OnboardingPage locale={locale} />;
    case "walking":
    case "sports":
    case "body":
    case "sleep":
    case "water":
    case "diet-plan":
      return <GenericTrackerPage page={currentPage} locale={locale} />;
    default:
      return <DashboardPage locale={locale} />;
  }
}
