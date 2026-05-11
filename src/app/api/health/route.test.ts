import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("/api/health", () => {
  it("returns runtime health without requiring auth or AI provider keys", async () => {
    const response = await GET(
      new Request("http://localhost/api/health", {
        headers: { "x-request-id": "test-health-id" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("test-health-id");
    expect(payload).toMatchObject({
      status: "ok",
      requestId: "test-health-id",
    });
    expect(payload).not.toHaveProperty("DEEPSEEK_API_KEY");
  });
});
