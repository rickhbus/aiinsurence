import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyHealthSummary } from "@/lib/health-os/types";

export function DailySummaryCard({ summary }: { summary: DailyHealthSummary }) {
  return (
    <Card className="health-card-glow border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles aria-hidden="true" />
        </span>
        <CardTitle>AI 今日摘要 / AI Daily Summary</CardTitle>
        <CardDescription>先用確定性資料整理，再按需要由伺服器 AI 補充。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-7 text-muted-foreground">{summary.summaryZh}</p>
        <p className="text-sm leading-6 text-muted-foreground">{summary.summaryEn}</p>
      </CardContent>
    </Card>
  );
}
