"use client";

import { Camera } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MealPhotoUploader({ onImageSelected }: { onImageSelected?: (file: File | null) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      相片 / Meal photo
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <Camera aria-hidden="true" className="size-5 text-primary" />
        <div className="min-w-0 flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => onImageSelected?.(event.target.files?.[0] ?? null)}
          />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            相片會先送到伺服器檢查和分析；瀏覽器不會直接連接 AI 供應商。
          </p>
        </div>
      </div>
    </label>
  );
}
