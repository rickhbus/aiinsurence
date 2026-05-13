import { Battery, BatteryCharging, BatteryLow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EnergyBattery } from "@/lib/health-quest/types";

export function EnergyBattery({ battery }: { battery: EnergyBattery }) {
  const Icon = battery.label === "low" ? BatteryLow : battery.label === "high" ? BatteryCharging : Battery;

  return (
    <Card className="border-border/60 bg-card/86 shadow-sm">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon aria-hidden="true" className={cn(
            battery.label === "low" && "text-amber-600",
            battery.label === "medium" && "text-sky-600",
            battery.label === "high" && "text-emerald-600",
          )} />
          Energy / 今日電量
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-bold tracking-normal">{battery.score}%</p>
          <Badge variant="secondary">{battery.recommendedIntensity}</Badge>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              battery.label === "low" && "bg-amber-500",
              battery.label === "medium" && "bg-sky-500",
              battery.label === "high" && "bg-emerald-500",
            )}
            style={{ width: `${battery.score}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
