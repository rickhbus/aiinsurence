"use client";

import { Camera } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MealPhotoUploader({ onPendingImage }: { onPendingImage?: (value: boolean) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      相片 / Meal photo
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <Camera aria-hidden="true" className="size-5 text-primary" />
        <div className="min-w-0 flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => onPendingImage?.(Boolean(event.target.files?.length))}
          />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            影像分析供應商尚未實作；目前不會假裝辨識相片，只會標記為 pending。
          </p>
        </div>
      </div>
    </label>
  );
}
