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
    expect(result.workflowPlan.lane).toBe("insurance_education");
    expect(result.workflowPlan.blockedUses.join(" ")).toContain("claim outcome guarantees");
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
    expect(result.workflowPlan.lane).toBe("safety");
    expect(result.userVisibleSummary).toContain("999");
  });

  it("returns zh-Hant workflow copy for Hong Kong user-facing analysis", async () => {
    const result = await runGblAnalysis({
      title: "家庭照護",
      analysisType: "healthcare_navigation",
      userType: "patient_member",
      language: "zh-Hant",
      primaryConcern: "爸爸皮膚痕咗兩個星期，想準備睇醫生。",
      save: false,
    }, "00000000-0000-4000-8000-000000000005");

    expect(result.userVisibleSummary).toContain("照護導航");
    expect(result.workflowPlan.primaryUse).toContain("症狀時間線");
    expect(result.recommendations[0].label).toContain("核實");
  });
});
