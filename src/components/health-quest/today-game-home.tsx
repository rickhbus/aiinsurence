"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { ConfettiBurst } from "./animation/confetti-burst";
import { GemFlyout } from "./animation/gem-flyout";
import { XpFlyout } from "./animation/xp-flyout";
import { FloatingNextAction } from "./floating-next-action";
import { GamePath } from "./game-path";
import { QuestBottomSheet } from "./quest-bottom-sheet";
import { TodayTopBar } from "./today-top-bar";
import { PlayCard } from "./play/play-card";
import { PlayCelebrationOverlay } from "./play/play-celebration-overlay";
import { PlayMascotPlaceholder } from "./play/play-mascot-placeholder";
import { gameCopy, tGame } from "@/lib/health-quest/game-copy";
import { questText } from "@/lib/health-quest/play-system";
import { getChestReward, rewardLabel, shouldUnlockDailyChest } from "@/lib/health-quest/rewards";
import type { DailyQuest, DailyQuestState, QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

export function TodayGameHome({
  state,
  locale,
  busy,
  apiFallback,
  completedQuest,
  celebrationOpen,
  onCelebrationOpenChange,
  onComplete,
  onSkip,
  onMakeEasier,
  onWhyThis,
  onSwitchToRecovery,
}: {
  state: DailyQuestState;
  locale: QuestLocale;
  busy?: boolean;
  apiFallback?: boolean;
  completedQuest: DailyQuest | null;
  celebrationOpen: boolean;
  onCelebrationOpenChange: (open: boolean) => void;
  onComplete: (quest: DailyQuest) => void;
  onSkip: (quest: DailyQuest) => void;
  onMakeEasier: (quest: DailyQuest) => void;
  onWhyThis: (quest: DailyQuest) => void;
  onSwitchToRecovery: () => void;
}) {
  const [selectedQuest, setSelectedQuest] = useState<DailyQuest | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chestOpened, setChestOpened] = useState(false);
  const [gems, setGems] = useState(12);
  const [gemBurst, setGemBurst] = useState(0);
  const [xpBurst, setXpBurst] = useState(0);
  const currentQuest = useMemo(() => findCurrentQuest(state), [state]);
  const chestUnlocked = shouldUnlockDailyChest(state);
  const safetyMode = state.mode === "safety";

  function selectQuest(quest: DailyQuest) {
    if (quest.status === "locked") {
      toast(tGame("lockedTinyStep", locale));
      return;
    }

    if (quest.status === "done" || quest.status === "skipped") {
      toast(tGame("rewardSummary", locale));
      return;
    }

    setSelectedQuest(quest);
    setSheetOpen(true);
  }

  async function openChest() {
    if (!chestUnlocked || chestOpened) {
      return;
    }

    try {
      const headers = await getSupabaseRequestHeaders({ "Content-Type": "application/json", Accept: "application/json" });
      const response = await fetch("/api/health-quest/rewards", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "open_daily_chest", localDate: state.localDate }),
      });
      const body = (await response.json().catch(() => null)) as { wallet?: { gems: number }; reward?: { amount: number } } | null;
      const amount = body?.reward?.amount ?? getChestReward(state.localDate, "local").gems;
      setGems(body?.wallet?.gems ?? gems + amount);
      setGemBurst(amount);
      setChestOpened(true);
      toast.success(rewardLabel(getChestReward(state.localDate, "local"), locale));
    } catch {
      const reward = getChestReward(state.localDate, "local");
      setGems((current) => current + reward.gems);
      setGemBurst(reward.gems);
      setChestOpened(true);
      toast.success(rewardLabel(reward, locale));
    } finally {
      window.setTimeout(() => setGemBurst(0), 1300);
    }
  }

  function completeWithBurst(quest: DailyQuest) {
    setXpBurst(quest.xp);
    window.setTimeout(() => setXpBurst(0), 1200);
    if (state.completedCount === 0 && !safetyMode) {
      void claimFirstQuestBonus();
    }
    onComplete(quest);
  }

  async function claimFirstQuestBonus() {
    try {
      const headers = await getSupabaseRequestHeaders({ "Content-Type": "application/json", Accept: "application/json" });
      const response = await fetch("/api/health-quest/rewards", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "claim_first_quest_bonus", localDate: state.localDate }),
      });
      const body = (await response.json().catch(() => null)) as { wallet?: { gems: number }; reward?: { amount: number }; duplicate?: boolean } | null;
      if (response.ok && body?.reward && !body.duplicate) {
        setGems(body.wallet?.gems ?? gems + body.reward.amount);
        setGemBurst(body.reward.amount);
        window.setTimeout(() => setGemBurst(0), 1300);
      }
    } catch {
      setGems((current) => current + 1);
      setGemBurst(1);
      window.setTimeout(() => setGemBurst(0), 1300);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-24 lg:pb-0">
      <TodayTopBar state={state} locale={locale} gems={gems} />

      <section className="relative overflow-hidden rounded-[1.8rem] border border-teal-500/15 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.54))] p-4 shadow-[0_18px_45px_rgba(15,118,110,0.12)] backdrop-blur-xl dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.88),rgba(15,23,42,0.66))] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-black text-teal-700 dark:text-teal-200">{tGame("dailyReady", locale)}</p>
            <h1 className="mt-1 text-3xl font-black tracking-normal sm:text-5xl">
              {locale === "en" ? "Health Quest" : "智健任務"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {state.mode === "recovery" ? tGame("recoveryOn", locale) : questText(state.coachNote, locale)}
            </p>
          </div>
          <PlayMascotPlaceholder mood={safetyMode ? "safety_serious" : state.mode === "recovery" ? "recovery" : "happy"} size="md" />
        </div>

        {safetyMode ? (
          <PlayCard className="mt-4 border-red-500/25 bg-red-500/10">
            <div className="flex items-start gap-3">
              <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0 text-red-600" />
              <p className="text-sm font-semibold leading-6 text-red-700 dark:text-red-200">
                {state.safetyMessage ? questText(state.safetyMessage, locale) : questText(gameCopy.emergencyHongKong, locale)}
              </p>
            </div>
          </PlayCard>
        ) : null}

        {apiFallback ? (
          <PlayCard className="mt-4 border-amber-400/30 bg-amber-400/10 text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant" ? "目前使用本機示範任務；匿名 Supabase session 準備好後會保存真實進度。" : "Using demo quests for now; real progress saves after the anonymous Supabase session is ready."}
          </PlayCard>
        ) : null}

        <GamePath state={state} locale={locale} chestOpened={chestOpened} onSelectQuest={selectQuest} onOpenChest={openChest} />

        <div className="hidden lg:block">
          <FloatingDesktopAction quest={currentQuest} locale={locale} busy={busy} onClick={() => currentQuest && selectQuest(currentQuest)} onSwitchToRecovery={onSwitchToRecovery} />
        </div>
      </section>

      <footer className="rounded-[1.4rem] border border-border/60 bg-card/70 p-4 text-xs leading-5 text-muted-foreground">
        <p>{questText(gameCopy.noClinicalReward, locale)}</p>
        <p className="mt-1">{locale === "zh-Hant" ? "健康任務不會用健康、心情、飲食、症狀、家庭或醫生準備資料作保險資格、定價、保障、索償結果或照護使用權決定。" : "Health Quest never uses health, mood, food, symptom, family, or doctor-prep data for insurance eligibility, pricing, coverage, claim outcomes, or care-access decisions."}</p>
      </footer>

      <QuestBottomSheet
        open={sheetOpen}
        quest={selectedQuest}
        locale={locale}
        busy={busy}
        onOpenChange={setSheetOpen}
        onComplete={completeWithBurst}
        onSkip={onSkip}
        onMakeEasier={onMakeEasier}
        onWhyThis={onWhyThis}
      />
      <FloatingNextAction quest={currentQuest} locale={locale} safetyMode={safetyMode} busy={busy} onClick={() => currentQuest && selectQuest(currentQuest)} />
      <PlayCelebrationOverlay
        open={celebrationOpen}
        safetyMode={safetyMode}
        title={completedQuest ? questText(completedQuest.completedLabel, locale) : tGame("completeCounts", locale)}
        detail={tGame("completeCounts", locale)}
        onClose={() => onCelebrationOpenChange(false)}
      />
      <XpFlyout amount={xpBurst} show={xpBurst > 0 && !safetyMode} />
      <GemFlyout amount={gemBurst} show={gemBurst > 0 && !safetyMode} />
      <ConfettiBurst show={celebrationOpen} safetyMode={safetyMode} />
    </div>
  );
}

function findCurrentQuest(state: DailyQuestState) {
  return state.quests.find((quest) => quest.status === "active" || quest.status === "recovery" || quest.status === "blocked_by_safety") ?? null;
}

function FloatingDesktopAction({
  quest,
  locale,
  busy,
  onClick,
  onSwitchToRecovery,
}: {
  quest: DailyQuest | null;
  locale: QuestLocale;
  busy?: boolean;
  onClick: () => void;
  onSwitchToRecovery: () => void;
}) {
  return (
    <div className="mx-auto mt-2 grid max-w-md gap-2">
      <button
        type="button"
        disabled={!quest || busy}
        onClick={onClick}
        className="min-h-14 rounded-2xl bg-teal-600 px-5 text-sm font-black text-white shadow-[0_9px_0_rgba(15,118,110,0.22)] transition active:translate-y-1 active:shadow-[0_4px_0_rgba(15,118,110,0.22)] disabled:opacity-50"
      >
        {quest ? questText(quest.actionLabel, locale) : tGame("nextTinyStep", locale)}
      </button>
      <button type="button" className="text-xs font-bold text-muted-foreground underline-offset-4 hover:underline" onClick={onSwitchToRecovery}>
        {locale === "en" ? "Switch to gentle mode" : "轉做輕量模式"}
      </button>
    </div>
  );
}
