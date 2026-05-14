"use client";

import { GamePathNode } from "./game-path-node";
import { RewardChestNode } from "./reward-chest-node";
import { BossReviewNode } from "./boss-review-node";
import { shouldUnlockDailyChest } from "@/lib/health-quest/rewards";
import type { DailyQuest, DailyQuestState, QuestLocale } from "@/lib/health-quest/types";

export function GamePath({
  state,
  locale,
  chestOpened,
  onSelectQuest,
  onOpenChest,
}: {
  state: DailyQuestState;
  locale: QuestLocale;
  chestOpened: boolean;
  onSelectQuest: (quest: DailyQuest) => void;
  onOpenChest: () => void;
}) {
  const chestUnlocked = shouldUnlockDailyChest(state);

  return (
    <section aria-label={locale === "en" ? "Daily Health Quest path" : "每日健康任務路線"} className="relative mx-auto grid w-full max-w-md justify-items-center overflow-hidden px-3 py-4">
      <div className="absolute left-1/2 top-10 h-[calc(100%-4rem)] w-3 -translate-x-1/2 rounded-full bg-teal-200/60 dark:bg-teal-900/55" aria-hidden="true" />
      <div className="relative z-10 grid w-full justify-items-center">
        {state.quests.map((quest, index) => (
          <GamePathNode
            key={quest.id}
            quest={quest}
            locale={locale}
            last={index === state.quests.length - 1 && state.completedCount < 3}
            onSelect={onSelectQuest}
          />
        ))}
        <RewardChestNode locale={locale} unlocked={chestUnlocked} opened={chestOpened} onOpen={onOpenChest} />
        <BossReviewNode locale={locale} />
      </div>
    </section>
  );
}

