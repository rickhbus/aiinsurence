import { describe, expect, it } from "vitest";
import { assertSafetyNeverGated } from "../entitlements";
import { buildDailyQuestState } from "../quest-engine";
import { shouldUseRecoveryMode } from "../recovery-mode";
import { evaluateQuestSafety, runCompletionSafetyGate } from "../safety-gates";

describe("Health Quest safety regressions", () => {
  it("routes chest pain and breathing trouble to urgent guidance before quests", () => {
    const gate = evaluateQuestSafety({ text: "I have chest pain and cannot breathe" });

    expect(gate.urgent).toBe(true);
    expect(gate.message?.en).toContain("call 999");
    expect(gate.message?.en).toContain("Accident & Emergency");
  });

  it("routes self-harm language to crisis safety mode", () => {
    const gate = evaluateQuestSafety({ text: "I might self harm tonight" });

    expect(gate.urgent).toBe(true);
    expect(gate.message?.zh).toContain("999");
  });

  it("routes fainting during workout to urgent safety guidance", () => {
    const state = buildDailyQuestState({
      localDate: "2026-05-14",
      healthContext: {
        locale: "zh-Hant",
        safetyFlags: ["fainting during workout"],
      },
    });

    expect(state.mode).toBe("safety");
    expect(state.safetyMessage?.en).toContain("Accident & Emergency");
  });

  it("routes blood in stool with severe pain to safety guidance", () => {
    const gate = evaluateQuestSafety({ text: "blood in stool with severe abdominal pain" });

    expect(gate.urgent).toBe(true);
    expect(gate.message?.zh).toContain("急症室");
  });

  it("routes stroke symptoms to urgent safety guidance", () => {
    const gate = evaluateQuestSafety({ text: "face drooping and stroke symptoms" });

    expect(gate.urgent).toBe(true);
    expect(gate.message?.en).toContain("999");
  });

  it("blocks XP-first completion UI when safety is urgent", () => {
    const state = buildDailyQuestState({ localDate: "2026-05-14", safetyStatus: "red" });
    const gate = runCompletionSafetyGate({
      quest: state.quests[0],
      actionPayload: { text: "chest pain" },
    });

    expect(state.mode).toBe("safety");
    expect(state.quests.every((quest) => quest.xp === 0)).toBe(true);
    expect(gate.urgent).toBe(true);
  });

  it("keeps recovery mode non-punitive", () => {
    expect(shouldUseRecoveryMode({
      healthContext: {
        locale: "zh-Hant",
        dailyLog: { sleepMinutes: 240, sleepQuality: 3, energyScore: 2 },
      },
    })).toBe(true);
  });

  it("never premium-gates emergency guidance", () => {
    expect(assertSafetyNeverGated("free")).toBe(true);
  });
});
