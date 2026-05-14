"use client";

import { UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function FamilyMemberCard({ name, detail }: { name: string; detail: string }) {
  return (
    <Card className="border-border/60 bg-card/86">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UserRound aria-hidden="true" />
        </span>
        <span>
          <strong className="block">{name}</strong>
          <span className="text-sm text-muted-foreground">{detail}</span>
        </span>
      </CardContent>
    </Card>
  );
}
