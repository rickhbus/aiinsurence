import type { QuestLocale } from "@/lib/health-quest/types";
import { UnitMap } from "./unit-map";

export function LearnSkillTree({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  return <UnitMap locale={locale} />;
}
