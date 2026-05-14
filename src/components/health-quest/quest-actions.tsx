"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { text } from "@/lib/health-quest/copy";
import type { DailyQuest, QuestLocale } from "@/lib/health-quest/types";
import { MakeEasierButton } from "./make-easier-button";
import { WhyThisDialog } from "./why-this-dialog";

export function QuestActions({
  quest,
  locale,
  disabled,
  busy,
  onComplete,
  onSkip,
  onMakeEasier,
  onWhyThis,
}: {
  quest: DailyQuest;
  locale: QuestLocale;
  disabled?: boolean;
  busy?: boolean;
  onComplete: (quest: DailyQuest) => void;
  onSkip: (quest: DailyQuest) => void;
  onMakeEasier: (quest: DailyQuest) => void;
  onWhyThis: (quest: DailyQuest) => void;
}) {
  const inactive = quest.status === "locked" || quest.status === "done" || quest.status === "skipped" || quest.status === "blocked_by_safety";

  return (
    <div className="flex flex-wrap gap-2">
      <MakeEasierButton quest={quest} locale={locale} disabled={busy || inactive} onMakeEasier={onMakeEasier} />
      <Button type="button" variant="ghost" size="sm" disabled={busy || quest.status === "locked" || quest.status === "done"} onClick={() => onSkip(quest)}>
        {locale === "en" ? "Skip today" : "今日略過"}
      </Button>
      <WhyThisDialog questType={quest.type} locale={locale} onOpen={() => onWhyThis(quest)} />
      <Button type="button" className="min-h-10 flex-1 sm:flex-none" disabled={disabled} onClick={() => onComplete(quest)}>
        {quest.status === "done" ? <Check data-icon="inline-start" aria-hidden="true" /> : null}
        {quest.status === "done" ? text(quest.completedLabel, locale) : text(quest.actionLabel, locale)}
      </Button>
    </div>
  );
}
