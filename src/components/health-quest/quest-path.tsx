"use client";

import { QuestNode } from "./quest-node";
import type { DailyQuest, DailyQuestState, QuestLocale } from "@/lib/health-quest/types";
import { QuestEmptyState } from "./quest-empty-state";

export function QuestPath({
  state,
  locale,
  busy,
  onComplete,
  onSkip,
}: {
  state: DailyQuestState;
  locale: QuestLocale;
  busy?: boolean;
  onComplete: (quest: DailyQuest) => void;
  onSkip: (quest: DailyQuest) => void;
}) {
  if (state.quests.length === 0) {
    return <QuestEmptyState locale={locale} />;
  }

  return (
    <section aria-label="Daily health quest path" className="relative grid gap-4">
      <div className="absolute bottom-8 left-6 top-8 hidden w-1 rounded-full bg-border min-[520px]:block" aria-hidden="true" />
      {state.quests.map((quest) => (
        <div key={quest.id} className="relative min-[520px]:pl-16">
          <span className="absolute left-[1.125rem] top-10 hidden size-4 rounded-full border-4 border-background bg-primary min-[520px]:block" aria-hidden="true" />
          <QuestNode
            quest={quest}
            locale={locale}
            busy={busy}
            onComplete={onComplete}
            onSkip={onSkip}
          />
        </div>
      ))}
    </section>
  );
}
