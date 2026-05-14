"use client";

import { Card, CardContent } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import { buildReminderPreview } from "@/lib/health-quest/reminders";
import type { QuestLocale } from "@/lib/health-quest/types";

export function ReminderCopyPreview({ locale }: { locale: QuestLocale }) {
  const previews = buildReminderPreview(["morning_quest", "water", "recovery_checkin", "weekly_review"]);

  return (
    <div className="grid gap-3">
      {previews.map((preview) => (
        <Card key={preview.type} className="border-border/60 bg-card/86">
          <CardContent className="p-4 text-sm">{text(preview.copy, locale)}</CardContent>
        </Card>
      ))}
    </div>
  );
}
