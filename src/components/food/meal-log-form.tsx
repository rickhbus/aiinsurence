"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHealthOsSubmit } from "@/components/health-os/client-submit";
import type { FoodAnalysis } from "@/lib/health-os/types";
import { MealPhotoUploader } from "./meal-photo-uploader";
import { NutritionSummaryCard } from "./nutrition-summary-card";

export function MealLogForm() {
  const { saving, submit } = useHealthOsSubmit();
  const [mealType, setMealType] = useState("lunch");
  const [hasImage, setHasImage] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [consentToSave, setConsentToSave] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = await submit({
      endpoint: consentToSave ? "/api/food/log" : "/api/food/analyze",
      payload: {
        mealType,
        imagePath: hasImage ? "pending-provider-image" : undefined,
        description: stringValue(data.get("description")),
        estimatedCalories: numberValue(data.get("estimatedCalories")),
        proteinG: numberValue(data.get("proteinG")),
        carbsG: numberValue(data.get("carbsG")),
        fatG: numberValue(data.get("fatG")),
        fiberG: numberValue(data.get("fiberG")),
        waterMl: numberValue(data.get("waterMl")),
        caffeineMg: numberValue(data.get("caffeineMg")),
        alcoholUnits: numberValue(data.get("alcoholUnits")),
        highSugarFlag: data.get("highSugarFlag") === "on",
        highSodiumFlag: data.get("highSodiumFlag") === "on",
        consentToSave,
      },
      successZh: consentToSave ? "已保存飲食紀錄。" : "已生成飲食摘要。",
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
            <CardTitle>Food & Nutrition Journal</CardTitle>
            <CardDescription>手動輸入先行；相片分析只保留安全 contract，不假裝已辨識。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              Meal type
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["breakfast", "lunch", "dinner", "snack", "drink"].map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <MealPhotoUploader onPendingImage={setHasImage} />
            <label className="grid gap-2 text-sm font-medium md:col-span-3">
              Manual meal text
              <Textarea name="description" placeholder="例如：雞飯少汁，加菜，凍檸茶少甜。" />
            </label>
            {["estimatedCalories", "proteinG", "carbsG", "fatG", "fiberG", "waterMl", "caffeineMg", "alcoholUnits"].map((name) => (
              <label key={name} className="grid gap-2 text-sm font-medium">
                {name}
                <Input name={name} type="number" inputMode="decimal" />
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm"><input name="highSugarFlag" type="checkbox" /> high sugar</label>
            <label className="flex items-center gap-2 text-sm"><input name="highSodiumFlag" type="checkbox" /> high sodium</label>
            <label className="flex items-start gap-2 rounded-xl bg-muted/30 p-3 text-sm leading-6 text-muted-foreground md:col-span-3">
              <input type="checkbox" className="mt-1" checked={consentToSave} onChange={(event) => setConsentToSave(event.target.checked)} />
              <span>同意保存飲食紀錄 / Save meal log</span>
            </label>
          </CardContent>
          <CardFooter>
            <Button disabled={saving}>{saving ? "整理中" : "保存 / 分析餐點"}</Button>
          </CardFooter>
        </form>
      </Card>
      <NutritionSummaryCard analysis={analysis} />
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
