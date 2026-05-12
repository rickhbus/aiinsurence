import Stripe from "stripe";
import { getPaymentConfig } from "./config";

export function getStripeClient(env: Record<string, string | undefined> = process.env) {
  const config = getPaymentConfig(env);

  if (!config.secretKey) {
    return null;
  }

  return new Stripe(config.secretKey);
}
