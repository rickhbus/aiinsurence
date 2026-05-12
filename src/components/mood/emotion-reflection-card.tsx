import { HeartPulse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MoodAnalysis } from "@/lib/health-os/types";
import { SafetyAlert } from "@/components/health-os/safety-alert";

export function EmotionReflectionCard({ analysis }: { analysis: MoodAnalysis | null }) {
  if (!analysis) {
    return (
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle>情緒反映 / Emotion reflection</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          輸入心情後，這裡會顯示「你的訊息聽起來像是……」的非診斷式反映。
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <HeartPulse aria-hidden="true" />
        </span>
        <CardTitle>{analysis.emotionLabel} / distress {analysis.distressLevel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        {analysis.safetyFlags.length > 0 ? <SafetyAlert status="red">{analysis.suggestedSmallAction}</SafetyAlert> : null}
        <p>{analysis.userFacingReflection}</p>
        <div className="rounded-xl bg-primary/5 p-3 text-foreground ring-1 ring-primary/20">
          <strong>一件小事 / One small action: </strong>
          {analysis.suggestedSmallAction}
        </div>
      </CardContent>
    </Card>
  );
}
