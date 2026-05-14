"use client";

import Link from "next/link";
import { Gem, Sparkles, UserRound } from "lucide-react";
import { EnergyHearts } from "./energy-hearts";
import { PlayBadge } from "./play/play-badge";
import { PlayStreakFlame } from "./play/play-streak-flame";
import type { DailyQuestState, QuestLocale } from "@/lib/health-quest/types";

export function TodayTopBar({
  state,
  locale,
  gems,
}: {
  state: DailyQuestState;
  locale: QuestLocale;
  gems: number;
}) {
  return (
    <header className="sticky top-[4.25rem] z-20 -mx-4 flex items-center justify-between gap-2 border-b border-white/40 bg-background/75 px-4 py-2 backdrop-blur-xl sm:mx-0 sm:rounded-[1.4rem] sm:border sm:shadow-sm lg:top-3">
      <div className="flex min-w-0 items-center gap-2">
        <PlayStreakFlame streak={state.streak.currentStreak} protectedToday={state.streak.protectedToday} />
        <EnergyHearts state={state} locale={locale} />
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <PlayBadge tone="accent">
          <Gem aria-hidden="true" className="size-4" />
          {gems}
        </PlayBadge>
        <PlayBadge tone="secondary">
          <Sparkles aria-hidden="true" className="size-4" />
          {state.earnedXpToday} XP
        </PlayBadge>
        <Link
          href="/profile"
          aria-label={locale === "en" ? "Profile" : "個人檔案"}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-700 shadow-sm dark:text-teal-200"
        >
          <UserRound aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

