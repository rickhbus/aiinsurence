"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHealthOsSubmit } from "@/components/health-os/client-submit";
import type { ToiletAnalysis } from "@/lib/health-os/types";
import { DigestionSummaryCard } from "./digestion-summary-card";

export function BowelUrineForm() {
  const { saving, submit } = useHealthOsSubmit();
  const [urineColor, setUrineColor] = useState("unknown");
  const [analysis, setAnalysis] = useState<ToiletAnalysis | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = await submit({
      endpoint: "/api/toilet/log",
      payload: {
        bowelMovement: data.get("bowelMovement") === "on",
        stoolType: numberValue(data.get("stoolType")),
        urineColor,
        painFlag: data.get("painFlag") === "on",
        bloodFlag: data.get("bloodFlag") === "on",
        feverFlag: data.get("feverFlag") === "on",
        dehydrationConcern: data.get("dehydrationConcern") === "on",
        notes: stringValue(data.get("notes")),
      },
      successZh: "已保存腸胃紀錄。",
    });

    if (body?.analysis) {
      setAnalysis(body.analysis);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Bowel and urine log</CardTitle>
            <CardDescription>Bristol-like 1-7 wording without overmedicalizing; red flags route to medical guidance.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm"><input name="bowelMovement" type="checkbox" /> bowel movement</label>
            <label className="grid gap-2 text-sm font-medium">
              stool type 1-7
              <Input name="stoolType" type="number" min={1} max={7} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              urine color
              <Select value={urineColor} onValueChange={setUrineColor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["clear", "pale_yellow", "yellow", "dark_yellow", "brown_red_pink", "unknown"].map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            {["painFlag", "bloodFlag", "feverFlag", "dehydrationConcern"].map((name) => (
              <label key={name} className="flex items-center gap-2 text-sm"><input name={name} type="checkbox" /> {name}</label>
            ))}
            <label className="grid gap-2 text-sm font-medium md:col-span-3">
              notes
              <Textarea name="notes" placeholder="例如：肚痛程度、尿色、是否頭暈。" />
            </label>
          </CardContent>
          <CardFooter>
            <Button disabled={saving}>{saving ? "保存中" : "保存腸胃紀錄"}</Button>
          </CardFooter>
        </form>
      </Card>
      <DigestionSummaryCard analysis={analysis} />
    </div>
  );
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: FormDataEntryValue | null) {
  const number = Number(stringValue(value));

  return Number.isFinite(number) && stringValue(value) !== "" ? number : undefined;
}
