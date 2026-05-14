import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

  it("rejects forbidden insurance decisioning phrases", () => {
    const forbidden = [
      "you are covered",
      "you will be approved",
      "your claim will pass",
      "your health score improves your premium",
      "this app decides eligibility",
    ];

    for (const phrase of forbidden) {
      expect(containsInsuranceGuarantee(phrase)).toBe(true);
    }
  });

  it("keeps insurance flow copy and routes away from eligibility, pricing, coverage, claims, and care-access decisions", () => {
    const route = readFileSync(join(process.cwd(), "src/app/api/health-quest/insurance-mission/route.ts"), "utf8");
    const page = readFileSync(join(process.cwd(), "src/components/health-quest/insurance-mission/insurance-mission-page.tsx"), "utf8");
    const banner = readFileSync(join(process.cwd(), "src/components/health-quest/insurance-mission/insurance-boundary-banner.tsx"), "utf8");

    expect(route).toContain("education_only_no_eligibility_pricing_coverage_claim_or_care_access_decisions");
    expect(banner).toContain("insuranceBoundary");
    expect(page).toContain("InsuranceBoundaryBanner");
    expect(`${route}\n${page}\n${banner}`).not.toMatch(/health score improves your premium|this app decides eligibility/iu);
  });
});
