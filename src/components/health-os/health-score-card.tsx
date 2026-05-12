import type { LucideIcon } from "lucide-react";
import { Activity, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function HealthScoreCard({
  title,
  value,
  helper,
  icon: Icon = Activity,
  tone = "default",
}: {
  title: string;
  value: string | number;
  helper: string;
  icon?: LucideIcon;
  tone?: "default" | "green" | "yellow" | "red";
}) {
  return (
    <Card className={cn("border-border/60 bg-card/80 shadow-sm backdrop-blur-xl", tone === "red" && "border-destructive/40 bg-destructive/5", tone === "yellow" && "border-amber-500/35 bg-amber-500/5", tone === "green" && "border-primary/30 bg-primary/5")}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="grid size-9 place-items-center rounded-lg bg-background/70 text-primary ring-1 ring-border/60">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-normal">{value}</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

export function SafetyStatusCard({ status }: { status: "green" | "yellow" | "red" }) {
  const copy = {
    green: "未見紅旗 / No red flags",
    yellow: "留意變化 / Watch closely",
    red: "先處理安全 / Safety first",
  }[status];

  return (
    <HealthScoreCard
      title="安全狀態 / Safety"
      value={copy}
      helper="紅旗會先於一般 AI 建議處理。Red flags are handled before normal AI guidance."
      icon={ShieldCheck}
      tone={status}
    />
  );
}
