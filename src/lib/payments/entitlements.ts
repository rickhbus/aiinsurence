import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentPlan } from "./config";
import { getPaymentConfig, paymentPlanOrder } from "./config";

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
  plan: PaymentPlan | "free";
  status: EntitlementStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
};

export const planEntitlements: Record<PaymentPlan | "free", Record<string, boolean | number>> = {
  free: {
    dailyCheckIn: true,
    basicLogs: true,
    weeklyReport: false,
    doctorExport: false,
    familySharing: false,
  },
  plus: {
    dailyCheckIn: true,
    basicLogs: true,
    weeklyReport: true,
    doctorExport: false,
    familySharing: false,
  },
  pro: {
    dailyCheckIn: true,
    basicLogs: true,
    weeklyReport: true,
    doctorExport: true,
    familySharing: false,
  },
  family: {
    dailyCheckIn: true,
    basicLogs: true,
    weeklyReport: true,
    doctorExport: true,
    familySharing: true,
    memberLimit: 6,
  },
};

export function mapStripePriceToPlan(
  priceId: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): PaymentPlan | null {
  if (!priceId) {
    return null;
  }

  const config = getPaymentConfig(env);

  return paymentPlanOrder.find((plan) => config.plans[plan].stripePriceId === priceId) ?? null;
}

export function planForSubscriptionStatus(plan: PaymentPlan | null, status: string | null | undefined) {
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
