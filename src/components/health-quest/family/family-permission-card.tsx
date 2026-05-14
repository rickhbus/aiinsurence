"use client";

import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { QuestLocale } from "@/lib/health-quest/types";

export function FamilyPermissionCard({ level, locale }: { level: string; locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/86">
      <CardContent className="flex items-center gap-3 p-4">
        <ShieldCheck aria-hidden="true" className="text-primary" />
        <p className="text-sm">
          {locale === "en" ? `Current sharing: ${level}` : `目前分享層級：${level}`}
        </p>
      </CardContent>
    </Card>
  );
}
