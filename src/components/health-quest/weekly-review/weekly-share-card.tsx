"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { QuestLocale } from "@/lib/health-quest/types";

export function WeeklyShareCard({ locale }: { locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/86">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users aria-hidden="true" />
          {locale === "en" ? "Share progress, not private details." : "分享進度，不分享私隱細節。"}
        </p>
        <Button asChild variant="outline">
          <Link href="/family/quest-circle">{locale === "en" ? "Family circle" : "家庭圈"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
