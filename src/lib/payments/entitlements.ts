import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentPlan } from "./config";
import { getPaymentConfig, paymentPlanOrder } from "./config";

export type LegacyPaymentPlan = "plus" | "pro";
export type EntitlementPlan = PaymentPlan | LegacyPaymentPlan | "free";

export type EntitlementStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export type EntitlementUpdate = {
  userId: string;
  plan: EntitlementPlan;
  status: EntitlementStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
};

export const planEntitlements: Record<EntitlementPlan, Record<string, boolean | number>> = {
  free: {
    dailyCheckIn: true,
    emergencyGuidance: true,
    basicCheckIn: true,
    privacyConsentSettings: true,
    basicLogs: true,
    sevenDayHistory: true,
    weeklyReport: false,
    familyWeeklyReport: false,
    doctorExport: false,
    doctorReportFullExport: false,
    advancedFoodPhotoAi: false,
    familySharing: false,
    familyCheckInDashboard: false,
  },
  care: {
    dailyCheckIn: true,
    emergencyGuidance: true,
    basicCheckIn: true,
    privacyConsentSettings: true,
    basicLogs: true,
    aiDailySuggestion: true,
    weeklyReport: true,
    familyWeeklyReport: false,
    basicDoctorSummary: true,
    doctorExport: false,
    doctorReportFullExport: false,
    advancedFoodPhotoAi: false,
    familySharing: false,
    familyCheckInDashboard: false,
  },
  family: {
    dailyCheckIn: true,
    emergencyGuidance: true,
    basicCheckIn: true,
    privacyConsentSettings: true,
    basicLogs: true,
    aiDailySuggestion: true,
    weeklyReport: true,
    familyWeeklyReport: true,
    doctorExport: true,
    doctorReportFullExport: true,
    advancedFoodPhotoAi: true,
    familySharing: true,
    familyCheckInDashboard: true,
    insuranceDocumentChecklist: true,
    memberLimit: 6,
  },
  plus: {
    dailyCheckIn: true,
    emergencyGuidance: true,
    basicCheckIn: true,
    privacyConsentSettings: true,
    basicLogs: true,
    weeklyReport: true,
    familyWeeklyReport: false,
    doctorExport: false,
    doctorReportFullExport: false,
    familySharing: false,
  },
  pro: {
    dailyCheckIn: true,
    emergencyGuidance: true,
    basicCheckIn: true,
    privacyConsentSettings: true,
    basicLogs: true,
    weeklyReport: true,
    familyWeeklyReport: false,
    doctorExport: true,
    doctorReportFullExport: true,
    familySharing: false,
  },
};

export function mapStripePriceToPlan(
  priceId: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): PaymentPlan | LegacyPaymentPlan | null {
  if (!priceId) {
    return null;
  }

  const config = getPaymentConfig(env);
  const currentPlan = paymentPlanOrder.find((plan) => config.plans[plan].stripePriceId === priceId);

  if (currentPlan) {
    return currentPlan;
  }

  const legacyPrices: Record<LegacyPaymentPlan, string | null> = {
    plus: clean(env.STRIPE_PRICE_PLUS),
    pro: clean(env.STRIPE_PRICE_PRO),
  };

  return (Object.keys(legacyPrices) as LegacyPaymentPlan[])
    .find((plan) => legacyPrices[plan] === priceId) ?? null;
}

export function planForSubscriptionStatus(
  plan: PaymentPlan | LegacyPaymentPlan | null,
  status: string | null | undefined,
) {
  if (!plan || !isPaidSubscriptionStatus(status)) {
    return "free";
  }

  return plan;
}

export function isPaidSubscriptionStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function upsertSubscriptionEntitlement(
  supabase: SupabaseClient,
  update: EntitlementUpdate,
) {
  return supabase
    .from("subscription_entitlements")
    .upsert({
      user_id: update.userId,
      plan: update.plan,
      status: update.status,
      features: planEntitlements[update.plan],
      stripe_customer_id: update.stripeCustomerId,
      stripe_subscription_id: update.stripeSubscriptionId,
      current_period_end: update.currentPeriodEnd,
      payment_provider: "stripe",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("*")
    .single();
}

function clean(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
