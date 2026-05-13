import { Leaf, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { healthQuestCopy, text } from "@/lib/health-quest/copy";
import type { DailyQuestState, QuestLocale } from "@/lib/health-quest/types";

export function RecoveryModeCard({
  state,
  locale,
  onSwitchToRecovery,
  busy,
}: {
  state: DailyQuestState;
  locale: QuestLocale;
  onSwitchToRecovery: () => void;
  busy?: boolean;
}) {
  if (state.mode !== "recovery" && state.energyBattery.label !== "low") {
    return null;
  }

  return (
    <Alert className="rounded-2xl border-amber-500/30 bg-amber-500/10">
      <Leaf aria-hidden="true" />
      <AlertTitle>{locale === "zh-Hant" ? "恢復都算數" : "Recovery counts"}</AlertTitle>
      <AlertDescription className="grid gap-3">
        <p>{text(healthQuestCopy.recoveryMode, locale)}</p>
        {state.mode !== "recovery" ? (
          <Button type="button" variant="outline" className="min-h-11 w-full sm:w-fit" disabled={busy} onClick={onSwitchToRecovery}>
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "改做輕量任務" : "Make quests gentler"}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
