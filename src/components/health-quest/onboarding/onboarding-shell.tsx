"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, HeartPulse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HEALTH_QUEST_ONBOARDING_LOCAL_STORAGE_KEY,
  buildOnboardingLocalStoragePayload,
} from "@/lib/health-quest/onboarding";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { BarrierStep } from "./barrier-step";
import { CoachStyleStep } from "./coach-style-step";
import { ConsentStep, type OnboardingConsentState } from "./consent-step";
import { GoalStep } from "./goal-step";
import { LanguageStep } from "./language-step";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingSummary } from "./onboarding-summary";
import { ReminderStep } from "./reminder-step";
import { StartingPathStep } from "./starting-path-step";
import { TimeStep } from "./time-step";

const STORAGE_KEY = "health-quest:onboarding-draft:v1";

type OnboardingDraft = {
  primaryGoal: string;
  dailyTimeBudget: string;
  hardestBarrier: string;
  preferredQuestTime: string;
  preferredLocale: QuestLocale;
  coachStyle: string;
  startingPath: string;
  reminderEnabled: boolean;
  consent: OnboardingConsentState;
};

const defaultDraft: OnboardingDraft = {
  primaryGoal: "better_sleep",
  dailyTimeBudget: "two_minutes",
  hardestBarrier: "i_forget",
  preferredQuestTime: "no_preference",
  preferredLocale: "zh-Hant",
  coachStyle: "gentle",
  startingPath: "easy_start",
  reminderEnabled: false,
  consent: {
    saveToSupabase: true,
    reminders: false,
    familySharingLater: false,
    analyticsPrivacyNoticeAcknowledged: false,
  },
};

const steps = [
  { title: { zh: "你最想改善咩？", en: "What do you want to improve?" }, key: "goal" },
  { title: { zh: "每日可以用幾耐？", en: "How much time each day?" }, key: "time" },
  { title: { zh: "最大阻力係咩？", en: "What gets in the way?" }, key: "barrier" },
  { title: { zh: "幾時做任務最舒服？", en: "When should quests fit?" }, key: "reminder" },
  { title: { zh: "你想用咩語言？", en: "Choose your language" }, key: "language" },
  { title: { zh: "教練語氣", en: "Coach style" }, key: "coach" },
  { title: { zh: "起始路線", en: "Starting path" }, key: "path" },
  { title: { zh: "保存同私隱", en: "Consent and privacy" }, key: "consent" },
  { title: { zh: "準備開始", en: "Ready to start" }, key: "summary" },
];

export function OnboardingShell({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft>(() => {
    if (typeof window === "undefined") {
      return { ...defaultDraft, preferredLocale: locale };
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<OnboardingDraft>;
        return { ...defaultDraft, ...parsed, preferredLocale: parsed.preferredLocale ?? locale };
      }

      return { ...defaultDraft, preferredLocale: locale };
    } catch {
      return { ...defaultDraft, preferredLocale: locale };
    }
  });
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const activeLocale = draft.preferredLocale === "bilingual" ? "zh-Hant" : draft.preferredLocale;
  const activeStep = steps[step] ?? steps[0];
  const canFinish = draft.consent.analyticsPrivacyNoticeAcknowledged;
  const consentStepIndex = steps.findIndex((item) => item.key === "consent");
  const advanceToNextStep = () => setStep((current) => Math.min(steps.length - 1, current + 1));
  const guardedAdvanceToNextStep = () => {
    if (activeStep.key === "consent" && !canFinish) {
      toast.error(activeLocale === "en" ? "Please acknowledge the privacy-safe analytics notice." : "請先確認私隱安全分析提示。");
      return;
    }

    advanceToNextStep();
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Local persistence is best effort only.
    }
  }, [draft]);

  const subtitle = useMemo(() => (
    activeLocale === "en"
      ? "Choose a few simple actions you can repeat."
      : "揀幾個你可以持續做到嘅簡單行動。"
  ), [activeLocale]);

  function save() {
    if (!canFinish) {
      toast.error(activeLocale === "en" ? "Please acknowledge the privacy-safe analytics notice." : "請先確認私隱安全分析提示。");
      setStep(consentStepIndex === -1 ? steps.length - 2 : consentStepIndex);
      return;
    }

    startTransition(async () => {
      const payload = toPayload(draft);

      try {
        const headers = await getSupabaseRequestHeaders({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
        const response = await fetch("/api/health-quest/onboarding", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("save failed");
        }

        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(HEALTH_QUEST_ONBOARDING_LOCAL_STORAGE_KEY);
        toast.success(activeLocale === "en" ? "Your Health Quest path is ready." : "你嘅健康任務路線準備好啦。");
        router.replace("/today");
      } catch {
        try {
          window.localStorage.setItem(
            HEALTH_QUEST_ONBOARDING_LOCAL_STORAGE_KEY,
            JSON.stringify(buildOnboardingLocalStoragePayload(payload)),
          );
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Local fallback is best effort only.
        }

        toast.message(activeLocale === "en" ? "Saved locally for now." : "暫時保存喺本機。");
        router.replace("/today");
      }
    });
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 py-5">
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <section className="rounded-3xl border border-border/60 bg-card/82 p-5 shadow-sm backdrop-blur-xl">
          <Badge variant="secondary" className="mb-4">
            <HeartPulse data-icon="inline-start" aria-hidden="true" />
            Health Quest
          </Badge>
          <h1 className="text-3xl font-bold tracking-normal">
            {activeLocale === "en" ? "Build your tiny daily health path" : "建立你每日小小健康路線"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          <div className="mt-5">
            <OnboardingProgress step={step} total={steps.length} />
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-sm backdrop-blur-xl sm:p-5">
          <h2 className="mb-4 text-xl font-semibold tracking-normal">
            {activeLocale === "en" ? activeStep.title.en : activeStep.title.zh}
          </h2>
          {renderStep({
            stepKey: activeStep.key,
            draft,
            locale: activeLocale,
            setDraft,
            onStepComplete: advanceToNextStep,
          })}
        </section>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 flex-1 rounded-2xl"
            disabled={step === 0 || isPending}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            {activeLocale === "en" ? "Back" : "返回"}
          </Button>
          {step < steps.length - 1 ? (
            <Button
              type="button"
              className="min-h-12 flex-1 rounded-2xl"
              onClick={guardedAdvanceToNextStep}
            >
              {activeLocale === "en" ? "Next" : "下一步"}
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="button" className="min-h-12 flex-1 rounded-2xl" disabled={isPending} onClick={save}>
              {isPending ? (activeLocale === "en" ? "Saving" : "保存中") : (activeLocale === "en" ? "Start today" : "開始今日")}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function renderStep({
  stepKey,
  draft,
  locale,
  setDraft,
  onStepComplete,
}: {
  stepKey: string;
  draft: OnboardingDraft;
  locale: QuestLocale;
  setDraft: Dispatch<SetStateAction<OnboardingDraft>>;
  onStepComplete: () => void;
}) {
  const updateDraftAndAdvance = (patch: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    onStepComplete();
  };

  switch (stepKey) {
    case "goal":
      return <GoalStep value={draft.primaryGoal} locale={locale} onChange={(primaryGoal) => updateDraftAndAdvance({ primaryGoal })} />;
    case "time":
      return <TimeStep value={draft.dailyTimeBudget} locale={locale} onChange={(dailyTimeBudget) => updateDraftAndAdvance({ dailyTimeBudget })} />;
    case "barrier":
      return <BarrierStep value={draft.hardestBarrier} locale={locale} onChange={(hardestBarrier) => updateDraftAndAdvance({ hardestBarrier })} />;
    case "reminder":
      return (
        <ReminderStep
          value={draft.preferredQuestTime}
          reminderEnabled={draft.reminderEnabled}
          locale={locale}
          onTimeChange={(preferredQuestTime) => {
            setDraft((current) => ({ ...current, preferredQuestTime }));
            onStepComplete();
          }}
          onReminderChange={(reminderEnabled) =>
            setDraft((current) => ({ ...current, reminderEnabled, consent: { ...current.consent, reminders: reminderEnabled } }))
          }
        />
      );
    case "language":
      return <LanguageStep value={draft.preferredLocale} locale={locale} onChange={(preferredLocale) => updateDraftAndAdvance({ preferredLocale: preferredLocale as QuestLocale })} />;
    case "coach":
      return <CoachStyleStep value={draft.coachStyle} locale={locale} onChange={(coachStyle) => updateDraftAndAdvance({ coachStyle })} />;
    case "path":
      return <StartingPathStep value={draft.startingPath} locale={locale} onChange={(startingPath) => updateDraftAndAdvance({ startingPath })} />;
    case "consent":
      return (
        <ConsentStep
          consent={draft.consent}
          locale={locale}
          onChange={(consent) => {
            setDraft((current) => ({ ...current, consent }));
            if (!draft.consent.analyticsPrivacyNoticeAcknowledged && consent.analyticsPrivacyNoticeAcknowledged) {
              onStepComplete();
            }
          }}
        />
      );
    default:
      return <OnboardingSummary locale={locale} goal={draft.primaryGoal} time={draft.dailyTimeBudget} path={draft.startingPath} />;
  }
}

function toPayload(draft: OnboardingDraft) {
  return {
    profile: {
      primaryGoal: draft.primaryGoal,
      dailyTimeBudget: draft.dailyTimeBudget,
      hardestBarrier: draft.hardestBarrier,
      startingPath: draft.startingPath,
      preferredLocale: draft.preferredLocale,
      coachStyle: draft.coachStyle,
    },
    preferences: {
      preferredQuestTime: draft.preferredQuestTime,
      reminderEnabled: draft.reminderEnabled,
      reminderTime: null,
      minimumRequiredQuests: draft.dailyTimeBudget === "thirty_seconds" ? 2 : 3,
      maxDailyQuests: draft.dailyTimeBudget === "thirty_seconds" ? 3 : 5,
      preferredDifficulty: draft.dailyTimeBudget === "thirty_seconds" ? "tiny" : "easy",
    },
    consent: {
      saveToSupabase: draft.consent.saveToSupabase,
      reminders: draft.consent.reminders,
      familySharingLater: draft.consent.familySharingLater,
      analyticsPrivacyNoticeAcknowledged: draft.consent.analyticsPrivacyNoticeAcknowledged,
    },
  };
}
