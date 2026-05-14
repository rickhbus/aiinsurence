"use client";

import { Sparkles } from "lucide-react";
import { PlayButton } from "./play/play-button";
import { PlayCard } from "./play/play-card";
import { plusFeatureText, plusTierCopy, shouldShowPlusUpsell, type PlusTier } from "@/lib/health-quest/plus-copy";
import { questText } from "@/lib/health-quest/play-system";
import type { DailyQuestMode, QuestLocale, QuestSafetyLevel } from "@/lib/health-quest/types";

export function PlusUpsellModal({
  open,
  locale,
  tier = "plus",
  mode,
  safetyLevel,
  onClose,
}: {
  open: boolean;
  locale: QuestLocale;
  tier?: Exclude<PlusTier, "free">;
  mode?: DailyQuestMode;
  safetyLevel?: QuestSafetyLevel;
  onClose: () => void;
}) {
  const allowed = shouldShowPlusUpsell({ mode, safetyLevel, moment: "weekly_review" });

  if (!open || !allowed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <PlayCard role="dialog" aria-modal="true" className="w-full max-w-sm bg-background p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-teal-500/12 text-teal-700 dark:text-teal-200">
            <Sparkles aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-black tracking-normal">{questText(plusTierCopy[tier].title, locale)}</h2>
            <p className="text-xs text-muted-foreground">{locale === "en" ? "More habit tools. Safety remains free." : "更多習慣工具。安全指引永遠免費。"}</p>
          </div>
        </div>
        <ul className="mt-4 grid gap-2 text-sm">
          {plusFeatureText(tier, locale).map((feature) => (
            <li key={feature} className="rounded-2xl bg-teal-500/8 px-3 py-2 font-medium">{feature}</li>
          ))}
        </ul>
        <div className="mt-5 grid gap-2">
          <PlayButton>{locale === "en" ? "See plans" : "查看方案"}</PlayButton>
          <button type="button" className="min-h-10 rounded-2xl text-sm font-bold text-muted-foreground" onClick={onClose}>
            {locale === "en" ? "Not now" : "暫時不用"}
          </button>
        </div>
      </PlayCard>
    </div>
  );
}

