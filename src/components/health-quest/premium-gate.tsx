"use client";

import type { ReactNode } from "react";
import { canUseHealthQuestFeature } from "@/lib/health-quest/entitlements";
import type { HealthQuestFeature, HealthQuestPlanLevel } from "@/lib/health-quest/types";
import { UpgradeCard } from "./upgrade-card";

export function PremiumGate({
  plan,
  feature,
  children,
}: {
  plan: HealthQuestPlanLevel;
  feature: HealthQuestFeature;
  children: ReactNode;
}) {
  if (canUseHealthQuestFeature(plan, feature)) {
    return children;
  }

  return <UpgradeCard feature={feature} />;
}
