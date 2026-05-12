import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as webhookPost } from "./route";

describe("payment webhook route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects invalid Stripe webhook signatures before entitlement writes", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");

    const response = await webhookPost(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "bad-signature" },
        body: "{}",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid Stripe signature",
    });
  });
});
