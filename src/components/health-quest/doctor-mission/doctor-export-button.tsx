"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuestLocale } from "@/lib/health-quest/types";

export function DoctorExportButton({ locale, onClick }: { locale: QuestLocale; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      <Download data-icon="inline-start" aria-hidden="true" />
      {locale === "en" ? "Export visit summary" : "匯出面診摘要"}
    </Button>
  );
}
