import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function XPCard({ xp }: { xp: number }) {
  return (
    <Card className="border-border/60 bg-card/86 shadow-sm">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles aria-hidden="true" className="text-yellow-500" />
          XP Today / 今日 XP
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-normal">{xp}</p>
        <p className="text-xs text-muted-foreground">Completion XP only, never medical scores.</p>
      </CardContent>
    </Card>
  );
}
