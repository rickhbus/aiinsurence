"use client";

import type { QuestLocale } from "@/lib/health-quest/types";
import { LearnSkillTree } from "./learn/learn-skill-tree";

export function HealthQuestLearnPage({ locale }: { locale: QuestLocale }) {
  return <LearnSkillTree locale={locale} />;
}
