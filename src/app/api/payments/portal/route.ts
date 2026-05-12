import { getPaymentConfig } from "@/lib/payments/config";
import { getStripeClient } from "@/lib/payments/stripe";
import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const config = getPaymentConfig();
  const stripe = getStripeClient();

  if (!config.secretKey || !config.appUrl || !stripe) {
    return jsonWithRequestId({ error: "Payment not configured" }, { status: 503 }, requestId);
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("subscription_entitlements")
    .select("stripe_customer_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能載入付款資料。" }, { status: 500 }, requestId);
  }

  if (!data?.stripe_customer_id) {
    return jsonWithRequestId({ error: "No Stripe customer is linked yet." }, { status: 400 }, requestId);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${config.appUrl}/pricing`,
  });

  return jsonWithRequestId({ url: session.url }, undefined, requestId);
}
