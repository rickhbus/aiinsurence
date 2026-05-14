"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { hasLocalOnboardingCompletion } from "@/lib/health-quest/onboarding";
import { healthQuestCopy, text } from "@/lib/health-quest/copy";
import { makeQuestEasier } from "@/lib/health-quest/make-easier";
import { buildMockDailyQuestState } from "@/lib/health-quest/mock-data";
import { buildDailyQuestState, questTypeToLifeTrackerAction } from "@/lib/health-quest/quest-engine";
import type { DailyQuest, DailyQuestState, QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { QuestErrorState } from "./quest-error-state";
import { QuestLoadingState } from "./quest-loading-state";
import { showQuestRewardToast } from "./quest-reward-toast";
import { TodayGameHome } from "./today-game-home";

type ApiStateResponse = {
  state?: DailyQuestState;
  error?: string;
  needsOnboarding?: boolean;
};

export function TodayQuestPage({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  const router = useRouter();
  const [state, setState] = useState<DailyQuestState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedQuest, setCompletedQuest] = useState<DailyQuest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadToday = useCallback(async () => {
    setError(null);
    try {
      const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
      const response = await fetch("/api/health-quest/today", { headers });
      const body = (await response.json().catch(() => null)) as ApiStateResponse | null;

      if (response.ok && body?.state) {
        setState(body.state);
        return;
      }

      if (response.status === 428 && body?.needsOnboarding) {
        if (hasLocalOnboardingCompletion(window.localStorage)) {
          setState(buildMockDailyQuestState());
          return;
        }

        router.replace("/onboarding");
        return;
      }

      setState(buildMockDailyQuestState());
      if (response.status !== 401 && response.status !== 503) {
        setError(body?.error ?? "Quest API unavailable.");
      }
    } catch {
      setState(buildMockDailyQuestState());
      setError(null);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadToday();
    });
    window.addEventListener("health-log-saved", loadToday);

    return () => window.removeEventListener("health-log-saved", loadToday);
  }, [loadToday]);

  async function completeQuest(quest: DailyQuest) {
    if (!state || isPending) {
      return;
    }

    startTransition(async () => {
      const actionPayload = buildActionPayload(quest);
      try {
        const headers = await getSupabaseRequestHeaders({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
        const response = await fetch("/api/health-quest/complete", {
          method: "POST",
          headers,
          body: JSON.stringify({ questId: quest.id, actionPayload }),
        });
        const body = (await response.json().catch(() => null)) as ApiStateResponse | null;

        if (!response.ok || !body?.state) {
          throw new Error(body?.error ?? "Quest completion failed.");
        }

        setState(body.state);
        setCompletedQuest({ ...quest, status: "done" });
        setModalOpen(true);
        showQuestRewardToast({ quest, locale });
        window.dispatchEvent(new Event("health-log-saved"));
      } catch {
        const nextState = completeQuestLocally(state, quest);
        setState(nextState);
        setCompletedQuest({ ...quest, status: "done" });
        setModalOpen(true);
        showQuestRewardToast({ quest, locale });
        window.dispatchEvent(new Event("health-log-saved"));
      }
    });
  }

  async function skipQuest(quest: DailyQuest) {
    if (!state || isPending) {
      return;
    }

    startTransition(async () => {
      try {
        const headers = await getSupabaseRequestHeaders({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
        const response = await fetch("/api/health-quest/skip", {
          method: "POST",
          headers,
          body: JSON.stringify({ questId: quest.id }),
        });
        const body = (await response.json().catch(() => null)) as ApiStateResponse | null;

        if (!response.ok || !body?.state) {
          throw new Error(body?.error ?? "Quest skip failed.");
        }

        setState(body.state);
        toast(locale === "zh-Hant" ? "已跳過。無需內疚。" : "Skipped. No guilt.");
      } catch {
        setState({
          ...state,
          quests: state.quests.map((item) => item.id === quest.id ? { ...item, status: "skipped", skippedAt: new Date().toISOString() } : item),
        });
        toast(locale === "zh-Hant" ? "已跳過。無需內疚。" : "Skipped. No guilt.");
      }
    });
  }

  async function makeEasier(quest: DailyQuest) {
    if (!state || isPending) {
      return;
    }

    const easierQuest = makeQuestEasier(quest);
    setState({
      ...state,
      quests: state.quests.map((item) => item.id === quest.id ? easierQuest : item),
    });

    startTransition(async () => {
      try {
        const headers = await getSupabaseRequestHeaders({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
        await fetch("/api/health-quest/make-easier", {
          method: "POST",
          headers,
          body: JSON.stringify({ questId: quest.id }),
        });
      } catch {
        // Local/demo mode still shows the easier version.
      } finally {
        toast(locale === "en" ? "Made easier." : "已轉做簡單啲。");
      }
    });
  }

  async function whyThis(quest: DailyQuest) {
    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      await fetch("/api/health-quest/why-this", {
        method: "POST",
        headers,
        body: JSON.stringify({ questType: quest.type, questId: quest.id }),
      });
    } catch {
      // Explanation display is client-side; analytics is best effort.
    }
  }

  function switchToRecovery() {
    if (!state || isPending) {
      return;
    }

    startTransition(async () => {
      try {
        const headers = await getSupabaseRequestHeaders({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
        const response = await fetch("/api/health-quest/recovery", {
          method: "POST",
          headers,
          body: JSON.stringify({ localDate: state.localDate }),
        });
        const body = (await response.json().catch(() => null)) as ApiStateResponse | null;

        if (!response.ok || !body?.state) {
          throw new Error(body?.error ?? "Recovery mode failed.");
        }

        setState(body.state);
        toast.success(text(healthQuestCopy.recoveryMode, locale));
      } catch {
        const next = buildDailyQuestState({
          localDate: state.localDate,
          healthContext: {
            locale: locale === "bilingual" ? "zh-Hant" : locale,
            dailyLog: { energyScore: 2, sleepMinutes: 250 },
          },
          previousStreak: state.streak,
        });
        setState(next);
        toast.success(text(healthQuestCopy.recoveryMode, locale));
      }
    });
  }

  if (!state && !error) {
    return <QuestLoadingState />;
  }

  if (!state && error) {
    return <QuestErrorState locale={locale} onRetry={() => void loadToday()} />;
  }

  if (!state) {
    return null;
  }

  return (
    <TodayGameHome
      state={state}
      locale={locale}
      busy={isPending}
      apiFallback={Boolean(error)}
      completedQuest={completedQuest}
      celebrationOpen={modalOpen}
      onCelebrationOpenChange={setModalOpen}
      onComplete={completeQuest}
      onSkip={skipQuest}
      onMakeEasier={makeEasier}
      onWhyThis={whyThis}
      onSwitchToRecovery={switchToRecovery}
    />
  );
}

function completeQuestLocally(state: DailyQuestState, quest: DailyQuest) {
  const now = new Date().toISOString();
  const quests = state.quests.map((item) =>
    item.id === quest.id
      ? { ...item, status: "done" as const, completedAt: now }
      : item,
  );

  return buildDailyQuestState({
    localDate: state.localDate,
    existingQuests: quests,
    previousStreak: state.streak,
    now,
  });
}

function buildActionPayload(quest: DailyQuest) {
  const action = questTypeToLifeTrackerAction(quest.type);
  const now = new Date().toISOString();

  if (!action) {
    return {
      action: quest.type,
      occurredAt: now,
      source: "health_quest",
    };
  }

  if (action === "water") {
    return { action, occurredAt: now, amount: 250, unit: "ml" };
  }

  if (action === "meal") {
    return {
      action,
      occurredAt: now,
      note: "食咗 / I ate",
      details: { mealType: "snack", foodName: "食咗 / I ate" },
    };
  }

  if (action === "mood") {
    return {
      action,
      occurredAt: now,
      details: {
        moodScore: 5,
        stressScore: 5,
        energyScore: 5,
        emotionLabel: "neutral",
        triggerCategory: "unknown",
        bodyLinks: [],
        userText: "Daily Health Quest mood check",
      },
    };
  }

  if (action === "move") {
    return {
      action,
      occurredAt: now,
      note: "郁咗 / I moved",
      details: { date: now.slice(0, 10), intensity: "light" },
    };
  }

  return { action, occurredAt: now, details: { source: "health_quest" } };
}
