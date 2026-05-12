"use client";

import type { FormEvent } from "react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Coffee, Droplets, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useHealthOsSubmit } from "@/components/health-os/client-submit";
import type { HydrationAnalysis } from "@/lib/health-os/types";
import { DrinkSummaryCard } from "./drink-summary-card";

export function HydrationQuickAdd() {
  const { saving, submit } = useHealthOsSubmit();
  const [analysis, setAnalysis] = useState<HydrationAnalysis | null>(null);

  async function quickAdd(waterMl: number, drinkType = "water") {
    const body = await submit({
      endpoint: "/api/hydration/log",
      payload: { waterMl, drinkType },
      successZh: `已新增 ${waterMl}ml。`,
    });

    if (body?.analysis) {
      setAnalysis(body.analysis);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = await submit({
      endpoint: "/api/hydration/log",
      payload: {
        waterMl: numberValue(data.get("waterMl")) ?? 0,
        caffeineMg: numberValue(data.get("caffeineMg")) ?? 0,
        alcoholUnits: numberValue(data.get("alcoholUnits")) ?? 0,
        drinkType: stringValue(data.get("drinkType")),
        notes: stringValue(data.get("notes")),
      },
      successZh: "已保存飲品紀錄。",
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
            <CardTitle>Hydration, caffeine, alcohol</CardTitle>
            <CardDescription>快速新增水、咖啡/茶/能量飲品和酒精，避免影響睡眠與恢復。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Button type="button" variant="outline" disabled={saving} onClick={() => quickAdd(250)}>
              <Droplets data-icon="inline-start" aria-hidden="true" />250ml
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={() => quickAdd(500)}>
              <Droplets data-icon="inline-start" aria-hidden="true" />500ml
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={() => quickAdd(0, "coffee")}>
              <Coffee data-icon="inline-start" aria-hidden="true" />Coffee
            </Button>
            <Field name="waterMl" label="water ml" />
            <Field name="caffeineMg" label="caffeine mg" />
            <Field name="alcoholUnits" label="alcohol units" icon={<Wine className="size-4" />} />
            <label className="grid gap-2 text-sm font-medium">
              drink type
              <Input name="drinkType" placeholder="water / coffee / tea / alcohol" />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              notes
              <Textarea name="notes" />
            </label>
          </CardContent>
          <CardFooter>
            <Button disabled={saving}>{saving ? "保存中" : "保存飲品"}</Button>
          </CardFooter>
        </form>
      </Card>
      <DrinkSummaryCard analysis={analysis} />
    </div>
  );
}

function Field({ name, label, icon }: { name: string; label: string; icon?: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span className="flex items-center gap-2">{icon}{label}</span>
      <Input name={name} type="number" inputMode="decimal" />
    </label>
  );
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: FormDataEntryValue | null) {
  const number = Number(stringValue(value));

  return Number.isFinite(number) && stringValue(value) !== "" ? number : undefined;
}
