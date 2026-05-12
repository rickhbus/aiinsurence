import { describe, expect, it } from "vitest";
import { mapStripePriceToPlan, planEntitlements, planForSubscriptionStatus } from "./entitlements";

describe("payment entitlement mapping", () => {
  it("maps Stripe price ids to internal plans", () => {
    const env = {
      STRIPE_PRICE_PLUS: "price_plus",
      STRIPE_PRICE_PRO: "price_pro",
      STRIPE_PRICE_FAMILY: "price_family",
    };

    expect(mapStripePriceToPlan("price_plus", env)).toBe("plus");
    expect(mapStripePriceToPlan("price_pro", env)).toBe("pro");
    expect(mapStripePriceToPlan("price_family", env)).toBe("family");
    expect(mapStripePriceToPlan("price_unknown", env)).toBeNull();
  });

  it("falls back to free when subscription status is not paid", () => {
    expect(planForSubscriptionStatus("pro", "active")).toBe("pro");
    expect(planForSubscriptionStatus("family", "trialing")).toBe("family");
    expect(planForSubscriptionStatus("plus", "canceled")).toBe("free");
    expect(planEntitlements.family.familySharing).toBe(true);
  });
});
