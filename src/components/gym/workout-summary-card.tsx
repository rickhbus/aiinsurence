import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GymAnalysis } from "@/lib/health-os/types";
import { SafetyAlert } from "@/components/health-os/safety-alert";

export function WorkoutSummaryCard({ analysis }: { analysis: GymAnalysis | null }) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Workout AI summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        {analysis ? (
          <>
            {analysis.safetyStatus === "red" ? <SafetyAlert status="red">{analysis.recoveryRecommendation}</SafetyAlert> : null}
            <p>{analysis.workoutSummary}</p>
            <p>{analysis.progressionInsight}</p>
            <p>{analysis.recoveryRecommendation}</p>
            <p>{analysis.nutritionLink}</p>
            <p>{analysis.moodLink}</p>
            <p className="font-medium text-foreground">{analysis.nextWorkoutSuggestion}</p>
          </>
        ) : (
          <p>記錄訓練後會顯示漸進、恢復、飲食和心情連結。</p>
        )}
      </CardContent>
    </Card>
  );
}
