import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ToiletAnalysis } from "@/lib/health-os/types";
import { SafetyAlert } from "@/components/health-os/safety-alert";

export function DigestionSummaryCard({ analysis }: { analysis: ToiletAnalysis | null }) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Digestion & urine summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        {analysis ? (
          <>
            {analysis.safetyStatus === "red" ? <SafetyAlert status="red">{analysis.nextAction}</SafetyAlert> : null}
            <p>{analysis.summary}</p>
            <p>{analysis.hydrationHint}</p>
            <p>{analysis.nextAction}</p>
          </>
        ) : (
          <p>記錄後會顯示補水和紅旗提示。血尿/血便、嚴重腹痛或脫水伴混亂會先處理安全。</p>
        )}
      </CardContent>
    </Card>
  );
}
