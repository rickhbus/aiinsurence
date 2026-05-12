import { getPaymentConfig, paymentPlanOrder } from "@/lib/payments/config";
import { jsonWithRequestId, getRequestId } from "@/lib/server/request-context";

export function GET(request: Request) {
  const requestId = getRequestId(request);
  const config = getPaymentConfig();

  return jsonWithRequestId({
    configured: config.checkoutConfigured,
    publishableConfigured: Boolean(config.publishableKey),
    plans: paymentPlanOrder.map((plan) => ({
      id: plan,
      name: config.plans[plan].name,
      priceLabel: config.plans[plan].priceLabel,
      checkoutEnabled: Boolean(config.checkoutConfigured && config.plans[plan].stripePriceId),
    })),
  }, undefined, requestId);
}
