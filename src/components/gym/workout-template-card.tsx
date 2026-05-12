import { Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutTemplate } from "@/lib/health-os/constants";

export function WorkoutTemplateCard({ template }: { template: WorkoutTemplate }) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Dumbbell aria-hidden="true" />
        </span>
        <CardTitle>{template.name}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{template.level}</Badge>
          <Badge variant="outline">{template.daysPerWeek} days/week</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
        {template.days.map((day) => (
          <div key={day.name} className="rounded-xl bg-muted/30 p-3">
            <p className="font-medium text-foreground">{day.name}: {day.focus}</p>
            <p>{day.exercises.join(", ")}</p>
          </div>
        ))}
        <p className="text-xs">{template.safetyNote}</p>
      </CardContent>
    </Card>
  );
}
