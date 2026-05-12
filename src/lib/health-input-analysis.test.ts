import { afterEach, describe, expect, it, vi } from "vitest";
import {
  analyzeHealthInputCore,
  buildHealthInputAnalysisResponse,
  createFallbackAssistant,
} from "./health-input-analysis";

describe("health input analysis system", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("safety-locks emergency medical input before follow-up questions", () => {
    const core = analyzeHealthInputCore({
      input: "我胸口痛，又覺得氣促",
      language: "zh-Hant",
      mode: "auto",
    }, "req_emergency");
    const response = buildHealthInputAnalysisResponse(core, createFallbackAssistant(core));

    expect(core.intakeMode).toBe("medical");
    expect(core.detectedDomain).toBe("emergency");
    expect(response.safety.safetyLocked).toBe(true);
    expect(response.summary.nextAction).toContain("999");
    expect(response.followUpQuestions).toHaveLength(0);
    expect(response.memoryProposal.canOffer).toBe(false);
  });

  it("safety-locks self-harm language even when it is not a symptom-routing term", () => {
    const core = analyzeHealthInputCore({
      input: "我覺得好絕望，想死",
      language: "zh-Hant",
      mode: "auto",
    }, "req_crisis");
    const response = buildHealthInputAnalysisResponse(core, createFallbackAssistant(core));

    expect(core.detectedDomain).toBe("self_harm");
    expect(response.safety.level).toBe("crisis");
    expect(response.safety.safetyLocked).toBe(true);
    expect(response.summary.urgencyLevel).toBe(1);
    expect(response.navigation.urgency.level).toBe(1);
    expect(response.summary.nextAction).toContain("999");
    expect(response.emotion.safety_flags.selfHarm).toBe(true);
  });

  it("auto-detects policy and insurance inputs without making guarantees", () => {
    const policyCore = analyzeHealthInputCore({
      input: "我想理解住院保單等候期和索償文件",
      language: "zh-Hant",
      mode: "auto",
    }, "req_policy");
    const insuranceCore = analyzeHealthInputCore({
      input: "我自僱，想買醫療保險",
      language: "zh-Hant",
      mode: "auto",
    }, "req_insurance");

    expect(policyCore.intakeMode).toBe("policy");
    expect(policyCore.navigation.requestType).toBe("policy_explanation");
    expect(insuranceCore.intakeMode).toBe("insurance");
    expect(insuranceCore.navigation.requestType).toBe("insurance_planning");
    expect(policyCore.safety.disallowedUses).toContain("coverage_or_claim_decision");
  });

  it("separates nutrition and fitness domains from clinical diagnosis", () => {
    const nutritionCore = analyzeHealthInputCore({
      input: "我想增肌，早餐應該食咩蛋白質？",
      language: "zh-Hant",
      mode: "auto",
    }, "req_nutrition");
    const fitnessCore = analyzeHealthInputCore({
      input: "跑步後膝頭痛兩日，應該點處理？",
      language: "zh-Hant",
      mode: "auto",
    }, "req_fitness");

    expect(nutritionCore.detectedDomain).toBe("nutrition");
    expect(fitnessCore.detectedDomain).toBe("fitness");
    expect(nutritionCore.safety.disallowedUses).toContain("diagnosis");
    expect(fitnessCore.navigation.disclaimer).toContain("不作診斷");
  });
});
