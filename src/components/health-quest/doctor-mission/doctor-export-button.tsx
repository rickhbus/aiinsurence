"use client";

import { Copy, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuestLocale } from "@/lib/health-quest/types";

export function DoctorExportButton({
  locale,
  onCopy,
  onDownloadJson,
  onPrint,
}: {
  locale: QuestLocale;
  onCopy: () => void;
  onDownloadJson: () => void;
  onPrint: () => void;
}) {
  return (
    <>
      <Button type="button" variant="outline" onClick={onPrint}>
        <Printer data-icon="inline-start" aria-hidden="true" />
        {locale === "en" ? "Print" : "列印"}
      </Button>
      <Button type="button" variant="outline" onClick={onDownloadJson}>
        <Download data-icon="inline-start" aria-hidden="true" />
        JSON
      </Button>
      <Button type="button" variant="outline" onClick={onCopy}>
        <Copy data-icon="inline-start" aria-hidden="true" />
        {locale === "en" ? "Copy" : "複製"}
      </Button>
    </>
  );
}
