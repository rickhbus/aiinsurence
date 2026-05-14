import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function PlayCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[1.4rem] border border-white/70 bg-white/78 p-4 shadow-[0_14px_38px_rgba(15,118,110,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/72 dark:shadow-black/20",
        className,
      )}
      {...props}
    />
  );
}

