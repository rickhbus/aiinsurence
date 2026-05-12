import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const meals = [
  "早餐：無糖豆漿、雞蛋、燕麥 / Breakfast",
  "午餐：雞飯少汁加菜 / Lunch",
  "飲品：咖啡一杯 / Drink",
];

export function MealHistoryList() {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Recent meals</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {meals.map((meal) => (
          <div key={meal} className="rounded-xl bg-muted/30 p-3 text-sm text-muted-foreground">
            {meal}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
