import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as checkoutPost } from "./route";

describe("payment checkout route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails safely when payment config is missing", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_PRICE_CARE", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    const response = await checkoutPost(
      new Request("http://localhost/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "care" }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: "Payment not configured",
    });
  });
});
