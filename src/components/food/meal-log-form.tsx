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
import type { FoodPhotoAnalysis } from "@/lib/food/photo-analysis";
import { MealPhotoUploader } from "./meal-photo-uploader";
import { NutritionSummaryCard } from "./nutrition-summary-card";

export function MealLogForm() {
  const { saving, submit } = useHealthOsSubmit();
  const [mealType, setMealType] = useState("lunch");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | FoodPhotoAnalysis | null>(null);
  const [consentToSave, setConsentToSave] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const manualPayload = buildManualPayload(data, mealType, consentToSave);

    if (photoFile) {
      const photoPayload = new FormData();
      photoPayload.set("image", photoFile);
      photoPayload.set("mealType", mealType);
      photoPayload.set("description", String(manualPayload.description ?? ""));

      const analyzed = await submit({
        endpoint: "/api/food/analyze",
        formData: photoPayload,
        successZh: "已完成相片粗略分析。",
      });
      const photoAnalysis = analyzed?.analysis;

      if (isFoodPhotoAnalysis(photoAnalysis)) {
        setAnalysis(photoAnalysis);
      }

      if (consentToSave) {
        await submit({
          endpoint: "/api/food/log",
          payload: {
            ...foodPhotoAnalysisToLogPayload(photoAnalysis, manualPayload, photoFile),
            consentToSave: true,
          },
          successZh: "已保存飲食紀錄。",
        });
      }

      return;
    }

    const body = await submit({
      endpoint: consentToSave ? "/api/food/log" : "/api/food/analyze",
      payload: manualPayload,
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
            <CardDescription>相片分析會以粗略估算回覆；未配置供應商時仍可用文字記錄。</CardDescription>
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
            <MealPhotoUploader onImageSelected={setPhotoFile} />
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

function buildManualPayload(data: FormData, mealType: string, consentToSave: boolean) {
  return {
    mealTime: new Date().toISOString(),
    mealType,
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
  };
}

function foodPhotoAnalysisToLogPayload(
  photoAnalysis: unknown,
  manualPayload: ReturnType<typeof buildManualPayload>,
  photoFile: File,
) {
  if (!isFoodPhotoAnalysis(photoAnalysis)) {
    return {
      ...manualPayload,
      imagePath: `browser-upload:${photoFile.name}`,
    };
  }

  return {
    mealTime: manualPayload.mealTime,
    mealType: manualPayload.mealType,
    imagePath: `browser-upload:${photoFile.name}`,
    description: photoAnalysis.mealName ?? manualPayload.description,
    estimatedCalories: photoAnalysis.estimatedCalories,
    proteinG: photoAnalysis.proteinG,
    carbsG: photoAnalysis.carbsG,
    fatG: photoAnalysis.fatG,
    fiberG: photoAnalysis.fiberG,
    waterMl: photoAnalysis.waterMl,
    caffeineMg: photoAnalysis.caffeineMg,
    alcoholUnits: photoAnalysis.alcoholUnits,
    highSugarFlag: photoAnalysis.highSugarFlag,
    highSodiumFlag: photoAnalysis.highSodiumFlag,
    aiSummary: photoAnalysis.summaryZh,
  };
}

function isFoodPhotoAnalysis(value: unknown): value is FoodPhotoAnalysis {
  return Boolean(value && typeof value === "object" && "summaryZh" in value);
}
