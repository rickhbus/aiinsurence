import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const entitlementFeatures = [
  "emergencyGuidance",
  "basicCheckIn",
  "privacyConsentSettings",
  "doctorReportFullExport",
  "familyWeeklyReport",
  "advancedFoodPhotoAi",
  "familyCheckInDashboard",
] as const;

export type EntitlementFeature = typeof entitlementFeatures[number];

export type ClientEntitlementState =
  | { status: "unknown"; plan: null; features: Record<string, unknown> }
  | { status: "known"; plan: string; features: Record<string, unknown> };

export const neverPaywalledFeatures = new Set<EntitlementFeature>([
  "emergencyGuidance",
  "basicCheckIn",
  "privacyConsentSettings",
]);

export async function getClientEntitlementState(): Promise<ClientEntitlementState> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return { status: "unknown", plan: null, features: {} };
  }

  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;

  if (!userId) {
    return { status: "unknown", plan: null, features: {} };
  }

  const { data, error } = await supabase
    .from("subscription_entitlements")
    .select("plan,status,features")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data || data.status !== "active") {
    return { status: "unknown", plan: null, features: {} };
  }

  return {
    status: "known",
    plan: String(data.plan ?? "free"),
    features: asFeatureRecord(data.features),
  };
}

export function canUseFeature(
  entitlement: ClientEntitlementState,
  feature: EntitlementFeature,
) {
  if (neverPaywalledFeatures.has(feature)) {
    return { allowed: true, shouldShowUpgrade: false, reason: "safety" as const };
  }

  if (entitlement.status === "unknown") {
    return { allowed: true, shouldShowUpgrade: true, reason: "unknown" as const };
  }

  const value = entitlement.features[feature];

  return {
    allowed: value === true,
    shouldShowUpgrade: value !== true,
    reason: value === true ? "included" as const : "upgrade" as const,
  };
}

function asFeatureRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
