"use client";

import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DailyQuest, QuestLocale } from "@/lib/health-quest/types";

export function MakeEasierButton({
  quest,
  locale,
  disabled,
  onMakeEasier,
}: {
  quest: DailyQuest;
  locale: QuestLocale;
  disabled?: boolean;
  onMakeEasier: (quest: DailyQuest) => void;
}) {
  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onMakeEasier(quest)}>
      <Wand2 data-icon="inline-start" aria-hidden="true" />
      {locale === "en" ? "Make it easier" : "轉做簡單啲"}
    </Button>
  );
}
