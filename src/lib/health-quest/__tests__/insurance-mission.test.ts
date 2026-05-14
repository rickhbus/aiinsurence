import { describe, expect, it } from "vitest";
import { containsInsuranceGuarantee, insuranceBoundary, sanitizeInsuranceMissionInput } from "../insurance-mission";

describe("insurance education mission", () => {
  it("keeps education-only boundary visible", () => {
    expect(insuranceBoundary.en).toContain("not insurance advice");
    expect(insuranceBoundary.en).toContain("do not decide eligibility");
  });

  it("removes guarantee and sensitive policy/claim text", () => {
    const sanitized = sanitizeInsuranceMissionInput({
      policyType: "policy text full private",
      preparingFor: "claim should pass",
      documents: ["receipts", "claim text private"],
      questions: ["What should I ask?", "You are covered"],
      explicitSensitiveTextSaveConsent: false,
    });

    expect(sanitized.policyType).toBeNull();
    expect(sanitized.preparingFor).toBeNull();
    expect(sanitized.documents).toEqual(["receipts"]);
    expect(sanitized.questions).toEqual(["What should I ask?"]);
    expect(containsInsuranceGuarantee("Your claim should pass")).toBe(true);
  });
});
