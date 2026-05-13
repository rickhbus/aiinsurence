import { toast } from "sonner";
import type { DailyQuest, QuestLocale } from "@/lib/health-quest/types";

export function showQuestRewardToast({
  quest,
  locale,
}: {
  quest: DailyQuest;
  locale: QuestLocale;
}) {
  const amount = quest.safetyLevel === "urgent" ? 0 : quest.xp;

  if (amount <= 0) {
    toast.success(locale === "zh-Hant" ? "安全指引已確認" : "Safety guidance acknowledged");
    return;
  }

  toast.success(`+${amount} XP`, {
    description: locale === "zh-Hant" ? "細小一步都算數。" : "Small steps count.",
  });
}
