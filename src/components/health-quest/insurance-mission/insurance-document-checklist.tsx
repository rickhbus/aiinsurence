"use client";

import type { QuestLocale } from "@/lib/health-quest/types";

const docs = [
  { zh: "保單或福利類別", en: "Policy or benefit category" },
  { zh: "收據或預約紀錄", en: "Receipts or appointment records" },
  { zh: "轉介信（如有）", en: "Referral letter if available" },
  { zh: "空白索償表格", en: "Blank claim form" },
  { zh: "想問顧問嘅問題", en: "Questions for adviser" },
];

export function InsuranceDocumentChecklist({ locale }: { locale: QuestLocale }) {
  return (
    <div className="grid gap-2 rounded-3xl border border-border/60 bg-card/86 p-4">
      {docs.map((doc) => (
        <label key={doc.en} className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 rounded border-border" />
          {locale === "en" ? doc.en : doc.zh}
        </label>
      ))}
    </div>
  );
}
