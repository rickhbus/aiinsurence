import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NextActionsCard({ actions }: { actions: string[] }) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>下一步 / Next Best Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action) => (
          <div key={action} className="flex gap-3 rounded-xl bg-muted/35 p-3 text-sm leading-6">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{action}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
