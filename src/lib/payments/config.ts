export type PaymentPlan = "plus" | "pro" | "family";

export type PaymentPlanConfig = {
  id: PaymentPlan;
  name: string;
  priceLabel: string;
  stripePriceId: string | null;
};

export type PaymentConfig = {
  appUrl: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  publishableKey: string | null;
  supabaseServiceRoleKey: string | null;
  plans: Record<PaymentPlan, PaymentPlanConfig>;
  checkoutConfigured: boolean;
  webhookConfigured: boolean;
};

type RawEnv = Record<string, string | undefined>;

export const paymentPlanOrder: PaymentPlan[] = ["plus", "pro", "family"];

export function getPaymentConfig(env: RawEnv = process.env): PaymentConfig {
  const appUrl = clean(env.NEXT_PUBLIC_APP_URL) || clean(env.APP_URL);
  const secretKey = clean(env.STRIPE_SECRET_KEY);
  const webhookSecret = clean(env.STRIPE_WEBHOOK_SECRET);
  const publishableKey = clean(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const supabaseServiceRoleKey = clean(env.SUPABASE_SERVICE_ROLE_KEY);
  const plans: Record<PaymentPlan, PaymentPlanConfig> = {
    plus: {
      id: "plus",
      name: "Plus",
      priceLabel: "HK$58/month",
      stripePriceId: clean(env.STRIPE_PRICE_PLUS),
    },
    pro: {
      id: "pro",
      name: "Pro",
      priceLabel: "HK$128/month",
      stripePriceId: clean(env.STRIPE_PRICE_PRO),
    },
    family: {
      id: "family",
      name: "Family",
      priceLabel: "HK$198/month",
      stripePriceId: clean(env.STRIPE_PRICE_FAMILY),
    },
  };
  const allPricesConfigured = paymentPlanOrder.every((plan) => Boolean(plans[plan].stripePriceId));

  return {
    appUrl,
    secretKey,
    webhookSecret,
    publishableKey,
    supabaseServiceRoleKey,
    plans,
    checkoutConfigured: Boolean(secretKey && publishableKey && appUrl && allPricesConfigured),
    webhookConfigured: Boolean(secretKey && webhookSecret && supabaseServiceRoleKey),
  };
}

export function getPaymentConfigIssues(env: RawEnv = process.env) {
  const config = getPaymentConfig(env);
  const issues: Array<{ key: string; message: string }> = [];

  if (!config.secretKey) {
    issues.push({ key: "STRIPE_SECRET_KEY", message: "Stripe server key is required for checkout and portal sessions." });
  }

  if (!config.webhookSecret) {
    issues.push({ key: "STRIPE_WEBHOOK_SECRET", message: "Stripe webhook secret is required before webhook processing can update entitlements." });
  }

  if (!config.supabaseServiceRoleKey) {
    issues.push({ key: "SUPABASE_SERVICE_ROLE_KEY", message: "A server-only Supabase service role key is required for Stripe webhook entitlement updates." });
  }

  if (!config.appUrl) {
    issues.push({ key: "NEXT_PUBLIC_APP_URL", message: "App URL is required for Stripe success and cancel redirects." });
  }

  if (!config.publishableKey) {
    issues.push({ key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", message: "Stripe publishable key is required before pricing shows real checkout actions." });
  }

  for (const plan of paymentPlanOrder) {
    if (!config.plans[plan].stripePriceId) {
      issues.push({ key: `STRIPE_PRICE_${plan.toUpperCase()}`, message: `${config.plans[plan].name} Stripe Price ID is missing.` });
    }
  }

  return issues;
}

export function getPlanConfig(plan: PaymentPlan, env: RawEnv = process.env) {
  return getPaymentConfig(env).plans[plan];
}

function clean(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
