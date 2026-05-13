import { Flame, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserStreak } from "@/lib/health-quest/types";

export function StreakCard({ streak }: { streak: UserStreak }) {
  return (
    <Card className="border-border/60 bg-card/86 shadow-sm">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Flame aria-hidden="true" className="text-orange-500" />
          Streak / 連續紀錄
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-bold tracking-normal">{streak.currentStreak}</p>
          <p className="text-xs text-muted-foreground">Best {streak.longestStreak} days</p>
        </div>
        <Badge variant={streak.protectedToday ? "default" : "secondary"} className="gap-1">
          <ShieldCheck aria-hidden="true" />
          {streak.protectedToday ? "Safe" : `${streak.streakFreezeCount} freeze`}
        </Badge>
      </CardContent>
    </Card>
  );
}
