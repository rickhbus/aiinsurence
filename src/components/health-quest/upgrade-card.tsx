"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HealthQuestFeature } from "@/lib/health-quest/types";

export function UpgradeCard({ feature }: { feature: HealthQuestFeature }) {
  return (
    <Card className="border-border/60 bg-card/86">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LockKeyhole aria-hidden="true" />
          {feature} is an optional premium feature. Safety guidance is never gated.
        </p>
        <Button asChild variant="outline">
          <Link href="/pricing">Pricing</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
