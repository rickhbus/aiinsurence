import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WorkoutStartCard() {
  return (
    <Card className="health-card-glow border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Start workout</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild>
          <a href="#workout-log"><Dumbbell data-icon="inline-start" aria-hidden="true" /> Start logging</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/gym/templates">Choose template</a>
        </Button>
      </CardContent>
    </Card>
  );
}
