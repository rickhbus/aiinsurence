"use client";

import { Check, DatabaseZap, Edit3, X } from "lucide-react";
import { useState } from "react";
import { label, text, ui } from "@/lib/health-app/i18n";
import type { Locale } from "@/lib/health-app/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function MemoryConsentCard({
  locale,
  defaultText = {
    zh: "使用者偏好高蛋白、少糖、香港本地食物，並表示跑步時偶爾膝蓋不適。",
    en: "User prefers high-protein, lower-sugar Hong Kong local food, and reports occasional knee discomfort when running.",
  },
}: {
  locale: Locale;
  defaultText?: { zh: string; en: string };
}) {
  const [value, setValue] = useState(text(defaultText, locale));
  const [status, setStatus] = useState<"pending" | "saved" | "declined" | "editing">("pending");

  return (
    <Card className="bg-card/85 shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <DatabaseZap aria-hidden="true" />
          </span>
          <div>
            <CardTitle>
              {locale === "zh-Hant" ? "是否儲存到健康記憶？" : "Save this to Health Memory?"}
            </CardTitle>
            <CardDescription>
              {locale === "zh-Hant"
                ? "健康記憶只會在你同意後保存；之後可查看、編輯或刪除。"
                : "Health memory is saved only with consent. You can view, edit, or delete it later."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {status === "editing" ? (
          <Textarea value={value} onChange={(event) => setValue(event.target.value)} aria-label="Memory text" />
        ) : (
          <p className="rounded-lg bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">{value}</p>
        )}
        {status === "saved" ? (
          <p className="text-sm text-muted-foreground">
            {locale === "zh-Hant" ? "已保存。你可以在健康記憶頁管理它。" : "Saved. You can manage it in Health Memory."}
          </p>
        ) : null}
        {status === "declined" ? (
          <p className="text-sm text-muted-foreground">
            {locale === "zh-Hant" ? "已略過保存。" : "Skipped saving."}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button type="button" disabled={status === "saved"} onClick={() => setStatus("saved")}>
          <Check data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "儲存" : label(ui.save, locale)}
        </Button>
        <Button type="button" variant="outline" onClick={() => setStatus("declined")}>
          <X data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "不儲存" : label(ui.dontSave, locale)}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setStatus("editing")}>
          <Edit3 data-icon="inline-start" aria-hidden="true" />
          {label(ui.edit, locale)}
        </Button>
      </CardFooter>
    </Card>
  );
}
