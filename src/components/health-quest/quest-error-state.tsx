import { RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { QuestLocale } from "@/lib/health-quest/types";

export function QuestErrorState({
  locale,
  onRetry,
}: {
  locale: QuestLocale;
  onRetry: () => void;
}) {
  return (
    <Alert className="rounded-2xl">
      <RefreshCw aria-hidden="true" />
      <AlertTitle>{locale === "zh-Hant" ? "任務暫時未能載入" : "Quests are unavailable"}</AlertTitle>
      <AlertDescription className="grid gap-3">
        <p>{locale === "zh-Hant" ? "你仍然可以稍後再試。安全提示不受影響。" : "You can try again shortly. Safety guidance is not blocked."}</p>
        <Button type="button" variant="outline" className="min-h-11 w-full sm:w-fit" onClick={onRetry}>
          <RefreshCw data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "重試" : "Retry"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
