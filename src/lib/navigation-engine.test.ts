import { describe, expect, it } from "vitest";
import { analyzeIntake } from "./navigation-engine";

describe("navigation engine", () => {
  it("escalates chest pain and breathlessness without follow-up questions", () => {
    const result = analyzeIntake("medical", "我胸口痛，又覺得氣促，應該去邊度？");

    expect(result.urgency.level).toBe(1);
    expect(result.requestType).toBe("urgent_medical");
    expect(result.nextAction).toContain("立即");
    expect(`${result.urgency.summary} ${result.escalation}`).toContain("999");
    expect(`${result.careRoute} ${result.possibleDepartments.join(" ")}`).toContain("A&E");
    expect(result.questions).toHaveLength(0);
    expect(result.possibleDepartments).toContain("急症室 / A&E");
    expect(result.memoryProposal.canOffer).toBe(false);
  });

  it("routes persistent itchy skin to GP and possible dermatology", () => {
    const result = analyzeIntake("medical", "我皮膚痕咗兩個星期，應該睇咩醫生？");

    expect(result.urgency.level).toBe(3);
    expect(result.requestType).toBe("symptom_navigation");
    expect(result.careRoute).toContain("普通科");
    expect(result.possibleDepartments.join(" ")).toContain("皮膚科");
    expect(result.disclaimer).toContain("不作診斷");
    expect(result.memoryProposal.canOffer).toBe(true);
  });

  it("marks concerning fever and vomiting as same-day care", () => {
    const result = analyzeIntake("medical", "高燒又持續嘔吐，飲唔到水");

    expect(result.urgency.level).toBe(2);
    expect(result.requestType).toBe("same_day_medical");
    expect(result.nextAction).toContain("今日內");
  });

  it("prioritizes paediatric routing for child symptom prompts", () => {
    const result = analyzeIntake("medical", "小朋友發燒又出疹兩日，應該睇咩科？");

    expect(result.possibleDepartments.join(" ")).toContain("兒科");
    expect(result.careRoute).toContain("小朋友");
  });

  it("keeps insurance planning at category level for self-employed users", () => {
    const result = analyzeIntake("insurance", "我 35 歲，自僱，住香港，沒有僱主醫療，應該買咩保險？");
    const output = [
      result.nextAction,
      result.careRoute,
      ...result.possibleDepartments,
      ...result.insuranceCategories,
      ...result.decisionChecklist,
    ].join(" ");

    expect(result.urgency.level).toBe(4);
    expect(result.insuranceCategories.join(" ")).toContain("自願醫保");
    expect(result.insuranceGuidance.priority.join(" ")).toContain("自願醫保");
    expect(result.insuranceGuidance.questionsBeforeBuying.join(" ")).toContain("等候期");
    expect(result.decisionChecklist.join(" ")).toContain("等候期");
    expect(result.memoryCandidates.join(" ")).toContain("僱主醫療福利");
    expect(result.memoryProposal.candidates.join(" ")).toContain("保障類型建議摘要");
    expect(result.escalation).toContain("持牌保險顧問");
    expect(result.disclaimer).toContain("不會保證承保");
    expect(output).not.toMatch(/AIA|友邦|Bupa|AXA|安盛|Cigna|Prudential|保誠|Manulife|宏利/i);
  });

  it("keeps family insurance planning at category level", () => {
    const result = analyzeIntake("insurance", "我有兩個小朋友，想比較家庭醫療保險");

    expect(result.requestType).toBe("insurance_planning");
    expect(result.insuranceCategories.join(" ")).toContain("家庭住院醫療");
    expect(result.insuranceGuidance.addOns.join(" ")).toContain("門診");
    expect(result.disclaimer).toContain("一般保險教育");
  });

  it("treats policy explanation as claims and wording review, not an approval decision", () => {
    const result = analyzeIntake("policy", "我想理解住院保單的不保事項、等候期和索償流程。");

    expect(result.requestType).toBe("policy_explanation");
    expect(result.classification).toContain("索償");
    expect(result.insuranceCategories).toContain("不保事項 / Exclusions");
    expect(result.insuranceGuidance.priority.join(" ")).toContain("保單條款");
    expect(result.decisionChecklist.join(" ")).toContain("補交文件");
    expect(result.escalation).toContain("索償爭議");
  });

  it("does not propose saving memory during emergency routing", () => {
    const result = analyzeIntake("medical", "突然劇烈頭痛，又失去知覺");

    expect(result.urgency.level).toBe(1);
    expect(result.memoryCandidates).toHaveLength(0);
    expect(result.memoryProposal.canOffer).toBe(false);
    expect(result.decisionChecklist.join(" ")).toContain("立即致電 999");
  });
});
