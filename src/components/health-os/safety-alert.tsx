import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SafetyAlert({ status = "green", children }: { status?: "green" | "yellow" | "red"; children?: ReactNode }) {
  if (status === "green" && !children) {
    return null;
  }

  return (
    <Alert className={status === "red" ? "border-destructive/40 bg-destructive/10" : "border-amber-500/35 bg-amber-500/10"}>
      <AlertTriangle aria-hidden="true" className="size-4" />
      <AlertTitle>{status === "red" ? "緊急提示 / Emergency" : "安全提示 / Safety note"}</AlertTitle>
      <AlertDescription className="leading-6">
        {children ?? "如有胸痛、呼吸困難、嚴重暈眩、中風徵兆、自殘念頭或其他緊急情況，請立即致電 999 或前往急症室。"}
      </AlertDescription>
    </Alert>
  );
}
