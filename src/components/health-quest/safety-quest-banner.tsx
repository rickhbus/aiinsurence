import { AlertTriangle, PhoneCall } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { healthQuestCopy, text } from "@/lib/health-quest/copy";
import type { DailyQuestState, QuestLocale } from "@/lib/health-quest/types";

export function SafetyQuestBanner({
  state,
  locale,
}: {
  state: DailyQuestState;
  locale: QuestLocale;
}) {
  if (state.mode !== "safety" && !state.safetyMessage) {
    return null;
  }

  return (
    <Alert variant="destructive" className="rounded-2xl">
      <AlertTriangle aria-hidden="true" />
      <AlertTitle>{locale === "zh-Hant" ? "安全優先" : "Safety first"}</AlertTitle>
      <AlertDescription className="grid gap-3">
        <p>{text(state.safetyMessage ?? healthQuestCopy.safety, locale)}</p>
        <Button asChild variant="destructive" className="min-h-11 w-full sm:w-fit">
          <a href="tel:999">
            <PhoneCall data-icon="inline-start" aria-hidden="true" />
            999
          </a>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
