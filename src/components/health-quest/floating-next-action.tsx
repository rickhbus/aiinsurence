"use client";

import { ArrowRight, ShieldAlert } from "lucide-react";
import { PlayButton } from "./play/play-button";
import { tGame } from "@/lib/health-quest/game-copy";
import { questText } from "@/lib/health-quest/play-system";
import type { DailyQuest, QuestLocale } from "@/lib/health-quest/types";

export function FloatingNextAction({
  quest,
  locale,
  safetyMode,
  busy,
  onClick,
}: {
  quest: DailyQuest | null;
  locale: QuestLocale;
  safetyMode?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-[5.5rem] z-30 px-4 lg:hidden">
      <div className="mx-auto max-w-md rounded-[1.35rem] border border-white/60 bg-background/88 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10">
        <PlayButton
          type="button"
          tone={safetyMode ? "safety" : "primary"}
          className="w-full"
          disabled={!quest || busy}
          onClick={onClick}
        >
          {safetyMode ? <ShieldAlert data-icon="inline-start" aria-hidden="true" /> : <ArrowRight data-icon="inline-start" aria-hidden="true" />}
          {quest ? questText(quest.actionLabel, locale) : tGame("nextTinyStep", locale)}
        </PlayButton>
      </div>
    </div>
  );
}

