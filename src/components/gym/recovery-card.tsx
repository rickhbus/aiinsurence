import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecoveryCard() {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader><CardTitle>Recovery score</CardTitle></CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        睡眠偏短、酸痛高或壓力高時，建議先選擇恢復型訓練。這不是保證可安全運動。
      </CardContent>
    </Card>
  );
}
