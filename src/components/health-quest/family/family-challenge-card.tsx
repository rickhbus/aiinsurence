"use client";

import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import { buildFamilyChallenge, type FamilyChallengeType } from "@/lib/health-quest/family-challenges";
import type { QuestLocale } from "@/lib/health-quest/types";

export function FamilyChallengeCard({ type, progress, locale }: { type: FamilyChallengeType; progress: number; locale: QuestLocale }) {
  const challenge = buildFamilyChallenge(type);

  return (
    <Card className="border-border/60 bg-card/86">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy aria-hidden="true" />
          {text(challenge.title, locale)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        <p>{text(challenge.description, locale)}</p>
        <p className="mt-2">{progress}/{challenge.target}</p>
      </CardContent>
    </Card>
  );
}
