import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QuestLocale } from "@/lib/health-quest/types";

export function WeeklyReviewCard({ locale }: { locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/82 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays aria-hidden="true" className="text-sky-600" />
          {locale === "zh-Hant" ? "每週回顧" : "Weekly review"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        {locale === "zh-Hant"
          ? "完成幾日小任務後，呢度會整理飲水、郁動、心情同恢復的一般生活趨勢。"
          : "After a few quest days, this summarizes general lifestyle trends for water, movement, mood, and recovery."}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full sm:w-fit">
          <Link href="/weekly-review">
            {locale === "zh-Hant" ? "開啟回顧" : "Open review"}
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
