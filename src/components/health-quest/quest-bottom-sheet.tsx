"use client";

import { HelpCircle, ShieldAlert, Sparkles } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { PlayBadge } from "./play/play-badge";
import { PlayButton } from "./play/play-button";
import { MascotMessage } from "./mascot/mascot-message";
import { gameCopy, tGame } from "@/lib/health-quest/game-copy";
import { questText } from "@/lib/health-quest/play-system";
import type { DailyQuest, QuestLocale } from "@/lib/health-quest/types";

export function QuestBottomSheet({
  open,
  quest,
  locale,
  busy,
  onOpenChange,
  onComplete,
  onSkip,
  onMakeEasier,
  onWhyThis,
}: {
  open: boolean;
  quest: DailyQuest | null;
  locale: QuestLocale;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (quest: DailyQuest) => void;
  onSkip: (quest: DailyQuest) => void;
  onMakeEasier: (quest: DailyQuest) => void;
  onWhyThis: (quest: DailyQuest) => void;
}) {
  const safety = quest?.status === "blocked_by_safety" || quest?.safetyLevel === "urgent";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg rounded-t-[1.75rem] border-teal-500/15 bg-background">
        {quest ? (
          <>
            <DrawerHeader className="text-left">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="grid size-16 place-items-center rounded-full bg-teal-500/12 text-teal-700 dark:text-teal-200">
                  {safety ? <ShieldAlert aria-hidden="true" className="size-8" /> : <Sparkles aria-hidden="true" className="size-8" />}
                </span>
                <div className="flex gap-2">
                  <PlayBadge tone={safety ? "safety" : "secondary"}>+{quest.xp} XP</PlayBadge>
                  <PlayBadge tone={quest.status === "recovery" ? "recovery" : "accent"}>
                    {quest.required ? (locale === "en" ? "Streak" : "連續") : (locale === "en" ? "Bonus" : "加分")}
                  </PlayBadge>
                </div>
              </div>
              <DrawerTitle className="text-2xl font-black tracking-normal">{questText(quest.title, locale)}</DrawerTitle>
              <DrawerDescription className="text-sm leading-6">
                {questText(quest.description, locale)}
              </DrawerDescription>
            </DrawerHeader>
            <div className="grid gap-3 px-4">
              <MascotMessage mood={safety ? "safety_serious" : quest.status === "recovery" ? "recovery" : "happy"}>
                {safety ? questText(gameCopy.emergencyHongKong, locale) : questText(quest.description, locale)}
              </MascotMessage>
              {safety ? (
                <p className="rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-sm font-medium leading-6 text-red-700 dark:text-red-200">
                  {tGame("safetyFirst", locale)} {questText(gameCopy.emergencyHongKong, locale)}
                </p>
              ) : null}
            </div>
            <DrawerFooter>
              <PlayButton
                type="button"
                tone={safety ? "safety" : quest.status === "recovery" ? "recovery" : "primary"}
                disabled={busy || safety}
                onClick={() => {
                  onOpenChange(false);
                  onComplete(quest);
                }}
              >
                {questText(quest.actionLabel, locale)}
              </PlayButton>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="secondary" className="min-h-11 rounded-2xl" disabled={busy || safety} onClick={() => onMakeEasier(quest)}>
                  {locale === "en" ? "Easier" : "簡單啲"}
                </Button>
                <Button variant="outline" className="min-h-11 rounded-2xl" disabled={busy || safety} onClick={() => {
                  onOpenChange(false);
                  onSkip(quest);
                }}>
                  {locale === "en" ? "Skip" : "跳過"}
                </Button>
                <Button variant="ghost" className="min-h-11 rounded-2xl" onClick={() => onWhyThis(quest)}>
                  <HelpCircle aria-hidden="true" className="size-4" />
                  {locale === "en" ? "Why" : "原因"}
                </Button>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {questText(gameCopy.noClinicalReward, locale)}
              </p>
            </DrawerFooter>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

