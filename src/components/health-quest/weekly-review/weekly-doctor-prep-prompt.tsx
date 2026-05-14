"use client";

import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import type { LocalizedText, QuestLocale } from "@/lib/health-quest/types";

export function WeeklyDoctorPrepPrompt({ prompt, locale }: { prompt?: LocalizedText | null; locale: QuestLocale }) {
  if (!prompt) {
    return null;
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/10">
      <CardContent className="grid gap-3 p-4">
        <p className="flex items-start gap-2 text-sm leading-6">
          <Stethoscope aria-hidden="true" className="mt-1" />
          {text(prompt, locale)}
        </p>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/doctor/mission">{locale === "en" ? "Prepare questions" : "準備問題"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
