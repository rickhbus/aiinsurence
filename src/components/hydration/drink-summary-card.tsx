import { Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HydrationAnalysis } from "@/lib/health-os/types";

export function DrinkSummaryCard({ analysis }: { analysis: HydrationAnalysis | null }) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Droplets aria-hidden="true" />
        </span>
        <CardTitle>Drink summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        {analysis ? (
          <>
            <p>{analysis.summary}</p>
            <p>{analysis.sleepMoodHint}</p>
            <p>{analysis.nextAction}</p>
          </>
        ) : (
          <p>快速新增水、咖啡因或酒精後，這裡會顯示睡眠和心情提示。</p>
        )}
      </CardContent>
    </Card>
  );
}
