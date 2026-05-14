"use client";

import { PlayChest } from "./play/play-chest";
import { PlayCard } from "./play/play-card";
import { gameCopy } from "@/lib/health-quest/game-copy";
import { questText } from "@/lib/health-quest/play-system";
import type { QuestLocale } from "@/lib/health-quest/types";

export function RewardChest({
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
    <PlayCard className="grid justify-items-center gap-3 text-center">
      <PlayChest unlocked={unlocked} opened={opened} label={questText(gameCopy.chestUnlocked, locale)} onOpen={onOpen} />
      <div>
        <h3 className="font-black">{questText(gameCopy.chestUnlocked, locale)}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {locale === "en" ? "Daily rewards are cosmetic and habit-based only." : "每日獎勵只用作習慣鼓勵和外觀收藏。"}
        </p>
      </div>
    </PlayCard>
  );
}

