"use client";

import { motion } from "framer-motion";
import { PartyPopper, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { healthQuestCopy, text } from "@/lib/health-quest/copy";
import type { DailyQuest, DailyQuestState, QuestLocale } from "@/lib/health-quest/types";

export function QuestCompletionModal({
  open,
  onOpenChange,
  quest,
  state,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quest: DailyQuest | null;
  state: DailyQuestState | null;
  locale: QuestLocale;
}) {
  if (!quest || !state) {
    return null;
  }

  const streakProtected = state.streak.protectedToday;
  const important = streakProtected || state.completedCount === 1 || state.completedCount >= state.quests.length;

  return (
    <Dialog open={open && important} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {streakProtected ? <ShieldCheck aria-hidden="true" className="text-emerald-600" /> : <PartyPopper aria-hidden="true" className="text-yellow-500" />}
            {streakProtected ? text(healthQuestCopy.streakSafe, locale) : text(quest.completedLabel, locale)}
          </DialogTitle>
          <DialogDescription>
            {locale === "zh-Hant"
              ? "健康任務獎勵完成行動和一致性，不獎勵完美數值。"
              : "Health Quest rewards action and consistency, not perfect numbers."}
          </DialogDescription>
        </DialogHeader>
        <motion.div
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="grid place-items-center rounded-3xl bg-primary/10 p-8 text-center"
        >
          <Sparkles aria-hidden="true" className="mb-3 text-primary" />
          <p className="text-4xl font-bold tracking-normal">+{quest.xp} XP</p>
          <p className="mt-2 text-sm text-muted-foreground">{text(quest.title, locale)}</p>
        </motion.div>
        <DialogFooter>
          <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
            {locale === "zh-Hant" ? "繼續" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
