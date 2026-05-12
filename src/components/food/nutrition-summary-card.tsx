import { Apple } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FoodAnalysis } from "@/lib/health-os/types";
import type { FoodPhotoAnalysis } from "@/lib/food/photo-analysis";

export function NutritionSummaryCard({ analysis }: { analysis: FoodAnalysis | FoodPhotoAnalysis | null }) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Apple aria-hidden="true" />
        </span>
        <CardTitle>Nutrition summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        {analysis && isFoodPhotoAnalysis(analysis) ? (
          <>
            <p>{analysis.summaryZh}</p>
            <p>
              {[
                analysis.estimatedCalories != null ? `${analysis.estimatedCalories} kcal` : null,
                analysis.proteinG != null ? `${analysis.proteinG}g protein` : null,
                analysis.carbsG != null ? `${analysis.carbsG}g carbs` : null,
                analysis.fatG != null ? `${analysis.fatG}g fat` : null,
              ].filter(Boolean).join(" / ") || "未能可靠估算營養數值。"}
            </p>
            <p>信心 / Confidence: {analysis.confidence}</p>
            <p>{analysis.disclaimerZh}</p>
          </>
        ) : analysis ? (
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

function isFoodPhotoAnalysis(analysis: FoodAnalysis | FoodPhotoAnalysis): analysis is FoodPhotoAnalysis {
  return "summaryZh" in analysis;
}
