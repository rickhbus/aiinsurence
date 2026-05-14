import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function PlayCard({ className, ...props }: ComponentProps<"div">) {
  return (
	    <div
	      className={cn(
	        "play-island-card rounded-[1.4rem] p-4",
	        className,
	      )}
      {...props}
    />
  );
}
