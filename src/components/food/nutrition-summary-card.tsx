import { Apple } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FoodAnalysis } from "@/lib/health-os/types";

export function NutritionSummaryCard({ analysis }: { analysis: FoodAnalysis | null }) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Apple aria-hidden="true" />
        </span>
        <CardTitle>Nutrition summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        {analysis ? (
          <>
            <p>{analysis.summary}</p>
            <p>{analysis.recoveryNote}</p>
            <p>{analysis.hydrationNote}</p>
            <p>{analysis.digestionNote}</p>
          </>
        ) : (
          <p>記錄一餐後會顯示粗略估算，不是醫療營養診斷。</p>
        )}
      </CardContent>
    </Card>
  );
}
