import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("/api/health/analyze", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/health/analyze", {
        method: "POST",
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("safety-locks emergency input before model generation", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");

    const response = await POST(
      new Request("http://localhost/api/health/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "auto",
          language: "zh-Hant",
          input: "我胸口痛，又呼吸困難",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.detectedDomain).toBe("emergency");
    expect(payload.safety.safetyLocked).toBe(true);
    expect(payload.assistant.ai.status).toBe("safety_locked");
    expect(payload.summary.nextAction).toContain("999");
  });

  it("returns deterministic policy analysis when the guide provider is unconfigured", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");

    const response = await POST(
      new Request("http://localhost/api/health/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "auto",
          language: "zh-Hant",
          input: "我想理解住院保單等候期和索償文件",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.intakeMode).toBe("policy");
    expect(payload.navigation.requestType).toBe("policy_explanation");
    expect(payload.assistant.ai.status).toBe("unconfigured");
    expect(payload.disclaimers.join(" ")).toContain("保證");
  });
});
