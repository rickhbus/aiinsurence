"use client";

import { PlayBadge } from "./play/play-badge";
import { PlayChest } from "./play/play-chest";
import { PlayPathConnector } from "./play/play-path-connector";
import { tGame } from "@/lib/health-quest/game-copy";
import type { QuestLocale } from "@/lib/health-quest/types";

export function RewardChestNode({
  locale,
  unlocked,
  opened,
  onOpen,
}: {
  locale: QuestLocale;
  unlocked: boolean;
  opened: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="relative grid justify-items-center pb-14">
      <div className="grid translate-x-[46px] justify-items-center gap-2 sm:translate-x-[82px]">
        <PlayChest unlocked={unlocked} opened={opened} onOpen={onOpen} label={tGame("chestUnlocked", locale)} />
        <PlayBadge tone={unlocked ? "accent" : "muted"}>
          {opened ? (locale === "en" ? "Opened" : "已開啟") : unlocked ? tGame("chestUnlocked", locale) : "3 quests"}
        </PlayBadge>
      </div>
      <PlayPathConnector state={unlocked ? "done" : "locked"} />
    </div>
  );
}

