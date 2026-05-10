import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("/api/navigation/guide", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/navigation/guide", {
        method: "POST",
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("safety-locks emergency responses before model generation", async () => {
    const response = await POST(
      new Request("http://localhost/api/navigation/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "medical",
          input: "我胸口痛，又呼吸困難",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.recommendation.urgency.level).toBe(1);
    expect(payload.recommendation.questions).toHaveLength(0);
    expect(payload.ai.status).toBe("safety_locked");
    expect(payload.recommendation.assistantMessage).toContain("call 999");
  });

  it("falls back deterministically when the AI provider is unconfigured", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");

    const response = await POST(
      new Request("http://localhost/api/navigation/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "insurance",
          input: "我自僱，想買醫療保險",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.recommendation.requestType).toBe("insurance_planning");
    expect(payload.ai.status).toBe("unconfigured");
    expect(payload.recommendation.insuranceGuidance.priority.join(" ")).toContain("自願醫保");
  });
});
