import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlayEnergyHeart({
  filled,
  recovery,
}: {
  filled: boolean;
  recovery?: boolean;
}) {
  return (
    <Heart
      aria-hidden="true"
      className={cn(
        "size-4",
        filled
          ? recovery
            ? "fill-amber-400 text-amber-500"
            : "fill-rose-400 text-rose-500"
          : "fill-transparent text-muted-foreground/40",
      )}
    />
  );
}

