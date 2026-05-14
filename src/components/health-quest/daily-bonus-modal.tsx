"use client";

import { Gem, Sparkles } from "lucide-react";
import { PlayButton } from "./play/play-button";
import { PlayMascotPlaceholder } from "./play/play-mascot-placeholder";
import type { QuestLocale } from "@/lib/health-quest/types";

export function DailyBonusModal({
  open,
  locale,
  gems,
  onClose,
}: {
  open: boolean;
  locale: QuestLocale;
  gems: number;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-[1.7rem] border border-white/60 bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex w-fit items-center gap-2">
          <Sparkles aria-hidden="true" className="text-amber-500" />
          <PlayMascotPlaceholder mood="happy" />
          <Gem aria-hidden="true" className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-black tracking-normal">
          {locale === "en" ? "Daily bonus" : "每日獎勵"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {locale === "en" ? `You earned ${gems} Health Gems.` : `你獲得 ${gems} 粒健康寶石。`}
        </p>
        <PlayButton className="mt-5 w-full" onClick={onClose}>{locale === "en" ? "Continue" : "繼續"}</PlayButton>
      </div>
    </div>
  );
}

