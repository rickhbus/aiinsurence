"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Flame, Gem, Gift, ShieldAlert, Sparkles, Trophy } from "lucide-react";
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
import { PlayBadge } from "./play/play-badge";
import { gameCopy, tGame } from "@/lib/health-quest/game-copy";
import { questText, turtleCoachIdentity } from "@/lib/health-quest/play-system";
import { getChestReward, rewardLabel, shouldUnlockDailyChest } from "@/lib/health-quest/rewards";
import type { DailyQuest, DailyQuestState, QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
    if (!chestUnlocked || chestOpened || safetyMode) {
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

      <section
        className={cn(
          "play-island-card relative overflow-hidden rounded-[1.8rem] p-4 sm:p-6",
          safetyMode && "play-safety-card",
        )}
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-lime-400 via-teal-500 to-sky-400" aria-hidden="true" />
        <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <PlayBadge tone={safetyMode ? "safety" : state.mode === "recovery" ? "recovery" : "primary"}>
                {safetyMode ? tGame("safetyFirst", locale) : tGame("dailyReady", locale)}
              </PlayBadge>
              <PlayBadge tone="secondary">
                <Trophy aria-hidden="true" className="size-4" />
                {locale === "en" ? "Jade League" : "翡翠聯賽"}
              </PlayBadge>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-5xl">
              {locale === "en" ? "Turtle Health Quest" : "小健龜智健任務"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {safetyMode
                ? state.safetyMessage ? questText(state.safetyMessage, locale) : questText(gameCopy.emergencyHongKong, locale)
                : state.mode === "recovery" ? tGame("recoveryOn", locale) : questText(state.coachNote, locale)}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <HeroStat icon={Flame} label={locale === "en" ? "Streak" : "連續"} value={`${state.streak.currentStreak}`} />
              <HeroStat icon={Sparkles} label={locale === "en" ? "Today XP" : "今日 XP"} value={`${state.earnedXpToday}`} />
              <HeroStat icon={Gem} label={locale === "en" ? "Gems" : "寶石"} value={`${gems}`} />
            </div>
            {currentQuest ? (
              <div className="mt-4 rounded-[1.4rem] border border-teal-500/20 bg-teal-500/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <PlayBadge tone={safetyMode ? "safety" : currentQuest.status === "recovery" ? "recovery" : "accent"}>
                    {locale === "en" ? "Current quest" : "目前任務"}
                  </PlayBadge>
                  <PlayBadge tone="secondary">+{currentQuest.xp} XP</PlayBadge>
                </div>
                <h2 className="mt-3 text-xl font-black tracking-normal">{questText(currentQuest.title, locale)}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{questText(currentQuest.description, locale)}</p>
              </div>
            ) : null}
          </div>
          <div className="grid gap-3 rounded-[1.6rem] border border-white/60 bg-white/55 p-4 text-center shadow-inner dark:border-white/10 dark:bg-white/5">
            <PlayMascotPlaceholder mood={safetyMode ? "safety_serious" : state.mode === "recovery" ? "recovery" : "happy"} size="lg" className="mx-auto" />
            <div>
              <p className="text-base font-black">{questText(turtleCoachIdentity.mascot, locale)}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {safetyMode
                  ? locale === "en" ? "Safety first. Rewards can wait." : "安全先行，獎勵可以等。"
                  : locale === "en" ? "Tiny steps count. No shame days." : "小步都算數，無內疚日。"}
              </p>
            </div>
            <button
              type="button"
              className="play-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 text-sm font-black text-slate-950 disabled:opacity-60"
              disabled={!chestUnlocked || chestOpened || safetyMode}
              onClick={openChest}
            >
              <Gift data-icon="inline-start" aria-hidden="true" />
              {chestOpened
                ? locale === "en" ? "Chest opened" : "寶箱已開"
                : chestUnlocked ? tGame("chestUnlocked", locale) : locale === "en" ? "Chest after 3 quests" : "完成 3 個開寶箱"}
            </button>
          </div>
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

function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
}) {
  return (
    <div className="play-stat-pill justify-start rounded-2xl px-3 py-2">
      <Icon aria-hidden="true" className="size-4 text-teal-600 dark:text-teal-200" />
      <span className="text-muted-foreground">{label}</span>
      <strong className="ml-auto text-base text-foreground">{value}</strong>
    </div>
  );
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
        className="play-pressable min-h-14 rounded-2xl bg-teal-600 px-5 text-sm font-black text-white disabled:opacity-50"
      >
        {quest ? questText(quest.actionLabel, locale) : tGame("nextTinyStep", locale)}
      </button>
      <button type="button" className="text-xs font-bold text-muted-foreground underline-offset-4 hover:underline" onClick={onSwitchToRecovery}>
        {locale === "en" ? "Switch to gentle mode" : "轉做輕量模式"}
      </button>
    </div>
  );
}
