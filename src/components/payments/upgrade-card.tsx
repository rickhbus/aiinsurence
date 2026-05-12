import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function UpgradeCard({
  title = "升級 Family Care",
  body = "屋企人知道今日有冇 check-in，更容易準備覆診。",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
        <Button asChild className="min-h-12 w-full sm:w-fit">
          <Link href="/pricing">睇 Family Care</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
