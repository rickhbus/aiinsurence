import { describe, expect, it, vi } from "vitest";
import { runGblAnalysis } from "./engine";

vi.stubEnv("DEEPSEEK_API_KEY", "");
vi.stubEnv("GROQ_API_KEY", "");
vi.stubEnv("OPENAI_API_KEY", "");
vi.stubEnv("AI_GATEWAY_API_KEY", "");
vi.stubEnv("VERCEL_OIDC_TOKEN", "");

describe("AI.GBL engine", () => {
  it("normalizes insurance analysis with disclaimers and emotion context", async () => {
    const result = await runGblAnalysis({
      title: "Claim document review",
      analysisType: "insurance_analysis",
      userType: "patient_member",
      language: "en",
      primaryConcern: "I need to understand what documents to gather for a hospital claim.",
      insuranceContext: "The insurer asked for receipts and a discharge summary.",
      emotionText: "I am confused and worried.",
      save: false,
    }, "00000000-0000-4000-8000-000000000003");

    expect(result.status).toBe("fallback");
    expect(result.analysisType).toBe("insurance_analysis");
    expect(["anxious", "confused"]).toContain(result.emotion?.primary_emotion);
    expect(result.recommendations.some((item) => item.humanReview)).toBe(true);
    expect(result.disclaimers.join(" ")).toContain("does not guarantee");
  });

  it("safety locks emergency language before provider enrichment", async () => {
    const result = await runGblAnalysis({
      title: "Urgent symptoms",
      analysisType: "healthcare_navigation",
      userType: "patient_member",
      language: "en",
      primaryConcern: "Severe chest pain and cannot breathe.",
      save: false,
    }, "00000000-0000-4000-8000-000000000004");

    expect(result.status).toBe("safety_locked");
    expect(result.safetyFlags.emergency).toBe(true);
    expect(result.userVisibleSummary).toContain("999");
  });
});
