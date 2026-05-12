import type Stripe from "stripe";
import {
  mapStripePriceToPlan,
  planForSubscriptionStatus,
  upsertSubscriptionEntitlement,
  type EntitlementStatus,
  type EntitlementUpdate,
} from "@/lib/payments/entitlements";
import { getPaymentConfig, type PaymentPlan } from "@/lib/payments/config";
import { getStripeClient } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const config = getPaymentConfig();
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!config.webhookSecret || !stripe) {
    return jsonWithRequestId({ error: "Payment webhook not configured" }, { status: 503 }, requestId);
  }

  if (!signature) {
    return jsonWithRequestId({ error: "Missing Stripe signature" }, { status: 400 }, requestId);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, config.webhookSecret);
  } catch {
    return jsonWithRequestId({ error: "Invalid Stripe signature" }, { status: 400 }, requestId);
  }

  const update = buildEntitlementUpdateFromEvent(event);

  if (!update) {
    return jsonWithRequestId({ received: true, ignored: event.type }, undefined, requestId);
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return jsonWithRequestId({ error: "Payment entitlement updater is not configured." }, { status: 503 }, requestId);
  }

  const { error } = await upsertSubscriptionEntitlement(supabase, update);

  if (error) {
    return jsonWithRequestId({ error: "暫時未能更新付款權限。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ received: true }, undefined, requestId);
}

function buildEntitlementUpdateFromEvent(event: Stripe.Event): EntitlementUpdate | null {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.userId ?? null;
    const plan = normalizePlan(session.metadata?.plan);

    if (!userId || !plan) {
      return null;
    }

    return {
      userId,
      plan,
      status: "active" as const,
      stripeCustomerId: stripeId(session.customer),
      stripeSubscriptionId: stripeId(session.subscription),
      currentPeriodEnd: null,
    };
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId ?? null;
    const priceId = subscription.items.data[0]?.price.id ?? null;
    const mappedPlan = mapStripePriceToPlan(priceId);
    const plan = planForSubscriptionStatus(mappedPlan, subscription.status);

    if (!userId) {
      return null;
    }

    return {
      userId,
      plan,
      status: subscription.status as EntitlementStatus,
      stripeCustomerId: stripeId(subscription.customer),
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: timestampToIso((subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end),
    };
  }

  return null;
}

function normalizePlan(value: string | null | undefined): PaymentPlan | null {
  return value === "plus" || value === "pro" || value === "family" ? value : null;
}

function stripeId(value: string | { id: string } | null) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function timestampToIso(value: number | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}
