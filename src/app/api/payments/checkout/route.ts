import { z } from "zod";
import { getPaymentConfig } from "@/lib/payments/config";
import { getStripeClient } from "@/lib/payments/stripe";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  plan: z.enum(["plus", "pro", "family"]),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const config = getPaymentConfig();
  const stripe = getStripeClient();

  if (!config.checkoutConfigured || !stripe) {
    return jsonWithRequestId({ error: "Payment not configured" }, { status: 503 }, requestId);
  }

  const parsed = await readValidatedJson(request, checkoutSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const plan = config.plans[parsed.data.plan];
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan.stripePriceId!, quantity: 1 }],
    success_url: `${config.appUrl}/pricing?checkout=success`,
    cancel_url: `${config.appUrl}/pricing?checkout=cancelled`,
    client_reference_id: auth.user.id,
    customer_email: auth.user.email ?? undefined,
    allow_promotion_codes: true,
    metadata: {
      userId: auth.user.id,
      plan: parsed.data.plan,
    },
    subscription_data: {
      metadata: {
        userId: auth.user.id,
        plan: parsed.data.plan,
      },
    },
  });

  return jsonWithRequestId({ url: session.url }, undefined, requestId);
}
