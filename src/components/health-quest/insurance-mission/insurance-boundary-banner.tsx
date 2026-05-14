"use client";

import { ShieldCheck } from "lucide-react";
import { text } from "@/lib/health-quest/copy";
import { insuranceBoundary } from "@/lib/health-quest/insurance-mission";
import type { QuestLocale } from "@/lib/health-quest/types";

export function InsuranceBoundaryBanner({ locale }: { locale: QuestLocale }) {
  return (
    <div className="rounded-3xl border border-primary/20 bg-primary/8 p-4 text-sm leading-6">
      <p className="flex items-start gap-2">
        <ShieldCheck aria-hidden="true" className="mt-1" />
        {text(insuranceBoundary, locale)}
      </p>
    </div>
  );
}
