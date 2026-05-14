"use client";

import { ShieldCheck } from "lucide-react";
import type { QuestLocale } from "@/lib/health-quest/types";

export function FamilyPrivacyExplainer({ locale }: { locale: QuestLocale }) {
  return (
    <div className="rounded-3xl border border-primary/20 bg-primary/8 p-4 text-sm leading-6">
      <p className="flex items-center gap-2 font-semibold">
        <ShieldCheck aria-hidden="true" />
        {locale === "en" ? "Share progress, not private details." : "分享進度，不分享私隱細節。"}
      </p>
      <p className="mt-2 text-muted-foreground">
        {locale === "en"
          ? "Default sharing is streak-only. Raw symptoms, mood notes, food text, diagnosis, medication, policy, or claim text are never shared by default."
          : "預設只分享連續紀錄。原始症狀、心情文字、食物描述、診斷、藥物、保單或索償文字不會預設分享。"}
      </p>
    </div>
  );
}
